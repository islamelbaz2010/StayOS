"""Tests for the import module — parser, validation, and preview generation."""

import io

import pytest

from app.importer.parser import parse_csv, parse_file, parse_xlsx
from app.importer.schemas import ImportRowData
from app.importer.services import generate_preview
from app.importer.validation import find_duplicates, validate_row


def _make_valid_row(row_number: int = 1, **overrides) -> ImportRowData:
    defaults = dict(
        row_number=row_number,
        title="Test Apartment",
        description="A nice apartment",
        address="123 Street",
        district="Maadi",
        city="Cairo",
        governorate="Cairo",
        country="Egypt",
        latitude=30.0,
        longitude=31.0,
        property_type="APARTMENT",
        bedrooms=2,
        beds=2,
        bathrooms=1,
        max_guests=4,
        price=500,
        currency="EGP",
        amenities=["wifi", "ac"],
        image_urls=["https://example.com/img1.jpg"],
        host_name="Test Host",
        host_phone="+201234567890",
        host_email="host@test.com",
        status="PENDING_VERIFICATION",
    )
    defaults.update(overrides)
    return ImportRowData(**defaults)


class TestCSVParser:
    def test_parse_csv_basic(self):
        csv_content = (
            "title,description,city,governorate,latitude,longitude,property_type,price,host_name,host_phone\n"
            "Apartment 1,Nice apt,Cairo,Cairo,30.0,31.0,APARTMENT,500,Host 1,+201234567890\n"
            "Apartment 2,Another apt,Giza,Giza,29.0,31.0,VILLA,800,Host 2,+201111111111\n"
        )
        rows = parse_csv(csv_content.encode("utf-8"))
        assert len(rows) == 2
        assert rows[0].title == "Apartment 1"
        assert rows[0].city == "Cairo"
        assert rows[0].latitude == 30.0
        assert rows[0].price == 500
        assert rows[1].title == "Apartment 2"
        assert rows[1].property_type == "VILLA"

    def test_parse_csv_with_aliases(self):
        csv_content = (
            "title,lat,lng,property type,price,city,governorate,description\n"
            "Test,30.0,31.0,STUDIO,300,Alexandria,Alexandria,Desc\n"
        )
        rows = parse_csv(csv_content.encode("utf-8"))
        assert len(rows) == 1
        assert rows[0].latitude == 30.0
        assert rows[0].longitude == 31.0
        assert rows[0].property_type == "STUDIO"

    def test_parse_csv_empty_rows_skipped(self):
        csv_content = (
            "title,description,city,governorate,latitude,longitude,property_type,price\n"
            "Valid,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500\n"
            ",,,,,,,\n"
            "Also Valid,Desc2,Giza,Giza,30.0,31.0,VILLA,600\n"
        )
        rows = parse_csv(csv_content.encode("utf-8"))
        assert len(rows) == 2

    def test_parse_csv_with_amenities_and_images(self):
        csv_content = (
            'title,description,city,governorate,latitude,longitude,property_type,price,amenities,image_urls\n'
            'Test,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500,"wifi,ac","https://img1.com/1.jpg,https://img2.com/2.jpg"\n'
        )
        rows = parse_csv(csv_content.encode("utf-8"))
        assert len(rows) == 1
        assert rows[0].amenities == ["wifi", "ac"]
        assert rows[0].image_urls == ["https://img1.com/1.jpg", "https://img2.com/2.jpg"]

    def test_parse_csv_bom_handled(self):
        csv_content = (
            "\ufefftitle,description,city,governorate,latitude,longitude,property_type,price\n"
            "Test,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500\n"
        )
        rows = parse_csv(csv_content.encode("utf-8"))
        assert len(rows) == 1
        assert rows[0].title == "Test"

    def test_parse_file_unsupported_format(self):
        with pytest.raises(ValueError, match="Unsupported file format"):
            parse_file("test.json", b"{}")


class TestXlsxParser:
    def test_parse_xlsx_basic(self):
        openpyxl = pytest.importorskip("openpyxl")
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["title", "description", "city", "governorate", "latitude", "longitude", "property_type", "price"])
        ws.append(["Excel Apt", "Nice", "Cairo", "Cairo", 30.0, 31.0, "APARTMENT", 500])
        ws.append(["Excel Villa", "Nice", "Giza", "Giza", 30.0, 31.0, "VILLA", 800])

        buf = io.BytesIO()
        wb.save(buf)
        rows = parse_xlsx(buf.getvalue())
        assert len(rows) == 2
        assert rows[0].title == "Excel Apt"
        assert rows[0].price == 500
        assert rows[1].title == "Excel Villa"

    def test_parse_xlsx_empty_rows_skipped(self):
        openpyxl = pytest.importorskip("openpyxl")
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["title", "description", "city", "governorate", "latitude", "longitude", "property_type", "price"])
        ws.append(["Valid", "Desc", "Cairo", "Cairo", 30.0, 31.0, "APARTMENT", 500])
        ws.append([None, None, None, None, None, None, None, None])
        ws.append(["Also Valid", "Desc2", "Giza", "Giza", 30.0, 31.0, "VILLA", 600])

        buf = io.BytesIO()
        wb.save(buf)
        rows = parse_xlsx(buf.getvalue())
        assert len(rows) == 2


class TestValidation:
    def test_valid_row_no_errors(self):
        row = _make_valid_row()
        errors = validate_row(row)
        assert len(errors) == 0

    def test_missing_required_fields(self):
        row = _make_valid_row(title="", description="", city="")
        errors = validate_row(row)
        fields = [e.field for e in errors]
        assert "title" in fields
        assert "description" in fields
        assert "city" in fields

    def test_invalid_latitude(self):
        row = _make_valid_row(latitude=100.0)
        errors = validate_row(row)
        assert any(e.field == "latitude" for e in errors)

    def test_invalid_longitude(self):
        row = _make_valid_row(longitude=-200.0)
        errors = validate_row(row)
        assert any(e.field == "longitude" for e in errors)

    def test_zero_zero_coordinates(self):
        row = _make_valid_row(latitude=0.0, longitude=0.0)
        errors = validate_row(row)
        assert any(e.field == "coordinates" for e in errors)

    def test_price_too_low(self):
        row = _make_valid_row(price=50)
        errors = validate_row(row)
        assert any(e.field == "price" for e in errors)

    def test_invalid_property_type(self):
        row = _make_valid_row(property_type="MANSION")
        errors = validate_row(row)
        assert any(e.field == "property_type" for e in errors)

    def test_invalid_status(self):
        row = _make_valid_row(status="PUBLISHED")
        errors = validate_row(row)
        assert any(e.field == "status" for e in errors)

    def test_max_guests_zero(self):
        row = _make_valid_row(max_guests=0)
        errors = validate_row(row)
        assert any(e.field == "max_guests" for e in errors)

    def test_bathrooms_zero(self):
        row = _make_valid_row(bathrooms=0)
        errors = validate_row(row)
        assert any(e.field == "bathrooms" for e in errors)


class TestDuplicateDetection:
    def test_no_duplicates(self):
        rows = [
            _make_valid_row(row_number=1, title="Apt 1"),
            _make_valid_row(row_number=2, title="Apt 2"),
        ]
        dups = find_duplicates(rows)
        assert len(dups) == 0

    def test_duplicate_detected(self):
        rows = [
            _make_valid_row(row_number=1, title="Same Apt", city="Cairo", governorate="Cairo"),
            _make_valid_row(row_number=2, title="Same Apt", city="Cairo", governorate="Cairo"),
        ]
        dups = find_duplicates(rows)
        assert 2 in dups

    def test_case_insensitive_duplicates(self):
        rows = [
            _make_valid_row(row_number=1, title="Apartment"),
            _make_valid_row(row_number=2, title="APARTMENT"),
        ]
        dups = find_duplicates(rows)
        assert 2 in dups


class TestPreviewGeneration:
    @pytest.mark.asyncio
    async def test_preview_valid_csv(self):
        csv_content = (
            "title,description,city,governorate,latitude,longitude,property_type,price\n"
            "Valid Apt,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500\n"
        )
        result = await generate_preview("test.csv", csv_content.encode("utf-8"))
        assert result.total_rows == 1
        assert result.valid_rows == 1
        assert result.invalid_rows == 0
        assert result.rows[0].is_valid is True
        assert result.rows[0].description == "Desc"
        assert result.rows[0].latitude == 30.0
        assert result.rows[0].longitude == 31.0

    @pytest.mark.asyncio
    async def test_preview_with_invalid_rows(self):
        csv_content = (
            "title,description,city,governorate,latitude,longitude,property_type,price\n"
            "Valid,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500\n"
            "Bad,Desc,Cairo,Cairo,999.0,31.0,APARTMENT,500\n"
            "Bad2,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,50\n"
        )
        result = await generate_preview("test.csv", csv_content.encode("utf-8"))
        assert result.total_rows == 3
        assert result.valid_rows == 1
        assert result.invalid_rows == 2
        assert result.rows[0].is_valid is True
        assert result.rows[0].description == "Desc"
        assert result.rows[0].latitude == 30.0
        assert result.rows[0].longitude == 31.0
        assert result.rows[1].is_valid is False
        assert result.rows[1].description == "Desc"
        assert result.rows[1].latitude == 999.0
        assert result.rows[1].longitude == 31.0
        assert result.rows[2].is_valid is False
        assert result.rows[2].description == "Desc"
        assert result.rows[2].latitude == 30.0
        assert result.rows[2].longitude == 31.0

    @pytest.mark.asyncio
    async def test_preview_with_duplicates(self):
        csv_content = (
            "title,description,city,governorate,latitude,longitude,property_type,price\n"
            "Dup,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500\n"
            "Dup,Desc,Cairo,Cairo,30.0,31.0,APARTMENT,500\n"
        )
        result = await generate_preview("test.csv", csv_content.encode("utf-8"))
        assert result.total_rows == 2
        assert result.duplicate_rows == 1
        assert result.valid_rows == 1
        assert result.rows[0].description == "Desc"
        assert result.rows[0].latitude == 30.0

    @pytest.mark.asyncio
    async def test_preview_unsupported_format(self):
        with pytest.raises(ValueError):
            await generate_preview("test.json", b"{}")
