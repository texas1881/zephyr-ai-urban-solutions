/** English text queries for zero-shot urban object detection (OWLv2 / OWL-ViT). */

export type UrbanQuery = {
  /** Text sent to the vision model. */
  query: string;
  /** Maps to our situation taxonomy when synthesizing without LLM. */
  situationHint:
    | "cop_kirliligi"
    | "asiri_kirli"
    | "dolu_cop_kutusu"
    | "yol_hasari"
    | "moloz_hafriyat"
    | "grafiti"
    | "kaldirim_isgali"
    | "bozuk_tabela"
    | "su_birikintisi"
    | "yabani_ot";
};

export const URBAN_DETECTION_QUERIES: UrbanQuery[] = [
  { query: "litter on the ground", situationHint: "cop_kirliligi" },
  { query: "scattered trash on sidewalk", situationHint: "cop_kirliligi" },
  { query: "plastic bag on street", situationHint: "cop_kirliligi" },
  { query: "garbage pile", situationHint: "asiri_kirli" },
  { query: "pile of waste", situationHint: "asiri_kirli" },
  { query: "overflowing trash bin", situationHint: "dolu_cop_kutusu" },
  { query: "full dumpster", situationHint: "dolu_cop_kutusu" },
  { query: "pothole in road", situationHint: "yol_hasari" },
  { query: "cracked pavement", situationHint: "yol_hasari" },
  { query: "damaged sidewalk", situationHint: "yol_hasari" },
  { query: "construction debris", situationHint: "moloz_hafriyat" },
  { query: "rubble pile", situationHint: "moloz_hafriyat" },
  { query: "graffiti on wall", situationHint: "grafiti" },
  { query: "blocked sidewalk", situationHint: "kaldirim_isgali" },
  { query: "obstacle on sidewalk", situationHint: "kaldirim_isgali" },
  { query: "fallen street sign", situationHint: "bozuk_tabela" },
  { query: "damaged road sign", situationHint: "bozuk_tabela" },
  { query: "water puddle on road", situationHint: "su_birikintisi" },
  { query: "overgrown weeds on sidewalk", situationHint: "yabani_ot" },
];

export const URBAN_QUERY_LABELS = URBAN_DETECTION_QUERIES.map((q) => q.query);
