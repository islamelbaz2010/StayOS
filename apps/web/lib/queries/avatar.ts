import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";

interface AvatarPresignResponse {
  upload_url: string;
  s3_key: string;
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: presign } = await api.post<AvatarPresignResponse>(
        "/auth/me/avatar/presign",
        { filename: file.name, content_type: file.type }
      );
      // The presigned PUT goes straight to S3 — a failure here or on the
      // confirm call leaves the profile unchanged (fail-closed).
      await fetch(presign.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      }).then((res) => {
        if (!res.ok) throw new Error("Upload failed");
      });
      await api.post("/auth/me/avatar", { s3_key: presign.s3_key });
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["host-profile"] });
    },
  });
}
