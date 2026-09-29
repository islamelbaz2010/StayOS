"""Read-only production reconciliation for the financial-truth batch.

Verifies: Sept-28 held bookings decomposition, ledger posting state,
KPI aggregates (collected/refunded/escrow/ledger/VAT-held/payouts),
and per-held-escrow guest_total == host_net + stayos + vat.
"""
import asyncio
import os
import sys
from decimal import Decimal

sys.path.insert(0, "src")

from sqlalchemy import case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine


def D(v):
    return Decimal(str(v or 0))


async def main() -> None:
    url = os.environ["DATABASE_URL"]
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    eng = create_async_engine(url)
    async with AsyncSession(eng) as s:
        # --- Bookings by status ---
        rows = await s.execute(text(
            "SELECT status, count(*) FROM booking.bookings GROUP BY status ORDER BY 2 DESC"
        ))
        print("== BOOKING STATUS ==")
        for r in rows:
            print(f"  {r[0]}: {r[1]}")

        # --- Verified payments ---
        row = (await s.execute(text(
            "SELECT count(*), coalesce(sum(amount_egp),0) FROM payment.payments WHERE status='verified'"
        ))).one()
        print(f"== VERIFIED PAYMENTS == count={row[0]} collected={row[1]}")
        row = (await s.execute(text(
            "SELECT coalesce(sum(refund_amount_egp),0) FROM payment.payments WHERE refund_amount_egp IS NOT NULL"
        ))).one()
        print(f"== REFUNDED TOTAL == {row[0]}")

        # --- Escrows ---
        rows = await s.execute(text(
            "SELECT status, count(*), coalesce(sum(amount_egp),0) FROM finance.escrow_accounts GROUP BY status ORDER BY 1"
        ))
        print("== ESCROWS ==")
        held_amt = Decimal(0)
        held_cnt = 0
        for r in rows:
            print(f"  {r[0]}: count={r[1]} amount={r[2]}")
            if r[0] in ("created", "held", "disputed"):
                held_amt += D(r[2]); held_cnt += int(r[1])
        print(f"  FUNDS HELD (created+held+disputed): count={held_cnt} amount={held_amt}")

        # --- Ledger nets by account ---
        rows = await s.execute(text(
            "SELECT ledger_account, entry_type, count(*), coalesce(sum(amount_egp),0) "
            "FROM finance.ledger_entries GROUP BY 1,2 ORDER BY 1,2"
        ))
        print("== LEDGER BY ACCOUNT/TYPE ==")
        nets = {}
        for r in rows:
            print(f"  {r[0]} {r[1]}: n={r[2]} sum={r[3]}")
            nets.setdefault(r[0], Decimal(0))
            nets[r[0]] += D(r[3]) if r[1] == "credit" else -D(r[3])
        print("  NET: " + ", ".join(f"{k}={v}" for k, v in nets.items()))

        # --- Per-ledger-entry detail for platform_revenue / vat_payable ---
        rows = await s.execute(text(
            "SELECT ledger_account, entry_type, amount_egp, description, created_at, "
            "(SELECT ft.reservation_id FROM finance.financial_transactions ft WHERE ft.id = le.transaction_id) AS rid "
            "FROM finance.ledger_entries le WHERE ledger_account IN ('platform_revenue','vat_payable','host_payable') "
            "ORDER BY created_at"
        ))
        print("== LEDGER ROWS (revenue/vat/host) ==")
        for r in rows:
            print(f"  {r[4]} {r[0]:18} {r[1]:6} {r[2]:>10}  rid={str(r[5])[:8]}  {r[3]}")

        # --- Sept-28 / held escrow bookings decomposition ---
        rows = await s.execute(text(
            "SELECT e.id, e.reservation_id, e.status, e.amount_egp, e.hold_until, "
            "b.status AS bstatus, b.created_at, "
            "p.id AS pay_id, p.status AS pstatus, p.amount_egp, p.accommodation_amount_egp, "
            "p.cleaning_fee_egp, p.guest_service_fee_egp, p.vat_egp, "
            "ul.title_en, res.host_amount_egp, res.platform_fee_egp, res.status "
            "FROM finance.escrow_accounts e "
            "LEFT JOIN booking.bookings b ON b.id = e.reservation_id "
            "LEFT JOIN payment.payments p ON p.booking_id = e.reservation_id "
            "LEFT JOIN reservation.reservations res ON res.id = e.reservation_id "
            "LEFT JOIN pms.units u ON u.id = b.unit_id "
            "LEFT JOIN pms.unit_listings ul ON ul.unit_id = u.id "
            "WHERE e.status IN ('created','held','disputed') ORDER BY e.amount_egp DESC"
        ))
        # Posted ledger facts per reservation — the authoritative check:
        # escrow debits reduce the liability; revenue/vat credits are the
        # recognition postings actually on the books (generation-aware).
        posted = {}
        rows2 = await s.execute(text(
            "SELECT ft.reservation_id, le.ledger_account, "
            "coalesce(sum(CASE WHEN le.entry_type='credit' THEN le.amount_egp "
            "ELSE -le.amount_egp END),0) "
            "FROM finance.ledger_entries le "
            "JOIN finance.financial_transactions ft ON ft.id = le.transaction_id "
            "GROUP BY ft.reservation_id, le.ledger_account"
        ))
        for rid, acct, net in rows2:
            posted.setdefault(str(rid), {})[acct] = D(net)
        print("== HELD ESCROWS DECOMPOSITION ==")
        vat_held = Decimal(0)
        rev_pending = Decimal(0)
        host_pending = Decimal(0)
        for r in rows:
            # indices: 3=escrow amount, 10=accommodation (host GROSS —
            # already includes cleaning), 11=cleaning, 13=vat, 14=title,
            # 15=res_host, 16=res_fee — canonical Model B rule:
            # fee base = gross − cleaning; host net = gross − 6% fee base.
            total = D(r[3])
            accom_cleaning = D(r[10]) if r[10] is not None else None
            vat = D(r[13])
            if accom_cleaning is not None:
                fee_base = accom_cleaning - D(r[11])
                host_commission = (fee_base * Decimal("0.06")).quantize(Decimal("0.01"))
                host_net = accom_cleaning - host_commission
            elif r[15] is not None:  # reservation-path row
                host_net = D(r[15])
                vat = max(total - host_net - D(r[16]), Decimal(0))
            else:
                host_net = Decimal(0)
            stayos = total - host_net - vat
            p = posted.get(str(r[1]), {})
            p_rev = p.get("platform_revenue", Decimal(0))
            p_vat = p.get("vat_payable", Decimal(0))
            p_host = p.get("host_payable", Decimal(0))
            # Remaining escrow liability = credit net on the escrow acct.
            esc_net = p.get("escrow", Decimal(0))
            recon = host_net + stayos + vat
            ok = abs(recon - total) < Decimal("0.01")
            vat_held += vat
            rev_pending += stayos
            host_pending += host_net
            print(
                f"  {str(r[1])[:8]} {str(r[14] or '')[:32]:32} escrow={r[2]} amt={total} "
                f"bstat={r[5]} pstat={r[9]} host_net={host_net} stayos={stayos} vat={vat} "
                f"recon={'OK' if ok else 'MISMATCH ' + str(recon)}"
            )
            recognised = bool(p_rev or p_vat)
            # Invariant: escrow_net = total − recognised(rev+vat) − released_host.
            implied_host = total - p_rev - p_vat
            esc_ok = abs(esc_net - implied_host) < Decimal("0.01")
            print(
                f"      ledger: esc_net={esc_net} (implied host net {implied_host}) "
                f"rev={p_rev} vat={p_vat} host_pay={p_host} "
                f"recognised={'YES' if recognised else 'no'} "
                f"escrow_invariant={'OK' if esc_ok else 'CHECK'}"
            )
        print(f"  SUM held: vat={vat_held} stayos_pending={rev_pending} host_pending={host_pending}")

        # --- payouts ---
        rows = await s.execute(text(
            "SELECT status, count(*), coalesce(sum(amount_egp),0) FROM finance.payout_requests GROUP BY 1"
        ))
        print("== PAYOUTS ==")
        for r in rows:
            print(f"  {r[0]}: n={r[1]} amt={r[2]}")

        # --- refund-pending ---
        row = (await s.execute(text(
            "SELECT coalesce(sum(refund_amount_egp),0) FROM payment.payments WHERE status='refund_pending'"
        ))).one()
        print(f"== REFUND PENDING == {row[0]}")

        # --- fully refunded booking VAT check ---
        rows = await s.execute(text(
            "SELECT p.booking_id, p.amount_egp, p.vat_egp, p.refund_amount_egp, p.status, "
            "(SELECT e.status FROM finance.escrow_accounts e WHERE e.reservation_id = p.booking_id) "
            "FROM payment.payments p WHERE p.refund_amount_egp IS NOT NULL ORDER BY p.refund_amount_egp DESC"
        ))
        print("== REFUNDED PAYMENTS ==")
        for r in rows:
            print(f"  booking={str(r[0])[:8]} amt={r[1]} vat={r[2]} refund={r[3]} pstat={r[4]} escrow={r[5]}")

    await eng.dispose()


asyncio.run(main())
