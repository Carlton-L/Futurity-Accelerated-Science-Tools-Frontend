export interface FuturityLab {
  _id: string;
  ent_name: string;
  lab_code: string;
  ent_summary: string;
  ent_url?: string;
  palette?: string[];
  new_ent_id?: string;
  picture_url?: string;
  thumb_url?: string;
  position: number;
  ent_fsid: string;
  visible: number; // 0 or 1
  free_lab: number; // 0 or 1
  ent_authors?: string[];
}
