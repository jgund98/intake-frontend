export interface options {
  icon?: string;
  label: string;
  value: string;
}

export interface FileData {
  name: string;
  contentType: string;
  data: string | ArrayBuffer | null;
  fileUrl?: string;
  s3Key?: string;
}