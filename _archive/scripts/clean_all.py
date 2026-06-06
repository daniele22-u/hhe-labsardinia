"""
Full data cleaning pipeline — handles 2018-2023 beach + floating litter.
Formats: old (2018-2020) and new (2020-2023).
"""
import pandas as pd
import numpy as np
import re
from pathlib import Path

ROOT    = Path(__file__).resolve().parents[1]
LABENV  = ROOT / "Labenv"
OUT     = ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

# ── Beach ID harmonization: old codes → MWE_SAR_* ──────────────────────────
BEACH_ID_MAP = {
    "0192-Alghero":   "MWE_SAR_1",
    "0004-Poetto":    "MWE_SAR_2",
    "0028-Costa Rei": "MWE_SAR_3",
    "0221-Is Arenas": "MWE_SAR_4",
    "0122-La Cinta":  "MWE_SAR_5",
    "0258-Porto Pino":"MWE_SAR_6",
}
BEACH_NAMES = {
    "MWE_SAR_1":"Alghero Lido","MWE_SAR_2":"Cagliari Poetto",
    "MWE_SAR_3":"Castiadas Costa Rei","MWE_SAR_4":"Oristano Is Arenas",
    "MWE_SAR_5":"San Teodoro La Cinta","MWE_SAR_6":"S.A. Arresi Porto Pino",
}

MAT_MAP = {
    "Polimeri artificiali":"Artificial polymer","Materiale naturale":"Natural matter",
    "Alghe/Fanerogame":"Natural matter","Legno lavorato":"Processed wood",
    "Rifiuto alimentare":"Food waste","Gomma":"Rubber","Metallo":"Metal",
    "Vetro/ceramica":"Glass/ceramics","Tessile":"Textiles",
    "Carta/cartone":"Paper/cardboard","Carta":"Paper/cardboard",
}

def norm(df, rename, keep):
    df = df.rename(columns={k:v for k,v in rename.items() if k in df.columns})
    return df[[c for c in keep if c in df.columns]]

# ══════════════════════════════════════════════════════════════════════════════
# 1. BEACH LITTER — Modulo_4
# ══════════════════════════════════════════════════════════════════════════════
MOD4_DIR = LABENV / "Modulo_4_2020_Med_Occ_2018-2023"

SPIAGGIA_RENAME_NEW = {
    "CodiceSpiaggia":"beach_id","NomeSpiaggia":"beach_name",
    "Latitudine":"lat","Longitudine":"lon","Regione":"region","Comune":"municipality",
    "LatitudeInizio":"lat","LongitudeInizio":"lon",
}
CAMP_RENAME_NEW = {
    "SampleID":"survey_id","CodiceCampionamento":"survey_id",
    "Year":"year","Anno":"year","Month":"month","Mese":"month",
    "Day":"day","Giorno":"day",
    "LunghezzaTransetto":"transect_m","Lunghezza":"transect_m",
    "CodiceSpiaggia":"beach_id","CodiceStagione":"season",
}
RIFIUTI_RENAME = {
    "SampleID":"survey_id","CodiceCampionamento":"survey_id",
    "JointListCategory":"category","IDCategoriaRifiuto":"category",
    "NumeroOggetti":"n_items","NumeroItems":"n_items","Sorgente":"source",
    "CodiceSpiaggia":"beach_id","Year":"year","Month":"month","Day":"day",
}

beach_frames = []
for f in sorted(MOD4_DIR.glob("*.xl*")):
    engine = "xlrd" if f.suffix == ".xls" else "openpyxl"
    try:
        xl = pd.ExcelFile(f, engine=engine)
        spiaggia = norm(xl.parse("Spiaggia"), SPIAGGIA_RENAME_NEW,
                        ["beach_id","beach_name","lat","lon","region","municipality"])
        camp_raw = xl.parse("SpiaggiaCamp")
        rif_raw  = xl.parse("RifiutiCamp")

        # Detect old format: SpiaggiaCamp lacks Year/Anno
        old_fmt = "Year" not in camp_raw.columns and "Anno" not in camp_raw.columns

        if old_fmt:
            rif = norm(rif_raw, RIFIUTI_RENAME,
                       ["survey_id","beach_id","year","month","day","category","n_items","source"])
            camp = norm(camp_raw, CAMP_RENAME_NEW, ["survey_id","beach_id","transect_m"])
            rif_agg = (rif.groupby(["survey_id","beach_id","year","month","day"])
                          .agg(total_items=("n_items","sum")).reset_index())
            df = rif_agg.merge(camp[["survey_id","transect_m"]], on="survey_id", how="left")
        else:
            camp = norm(camp_raw, CAMP_RENAME_NEW,
                        ["survey_id","beach_id","year","month","day","season","transect_m"])
            rif  = norm(rif_raw, RIFIUTI_RENAME, ["survey_id","category","n_items","source"])
            items = (rif.groupby("survey_id")["n_items"].sum()
                       .reset_index().rename(columns={"n_items":"total_items"}))
            df = camp.merge(items, on="survey_id", how="left")

        df = df.merge(spiaggia, on="beach_id", how="left")
        df["transect_m"] = pd.to_numeric(df["transect_m"], errors="coerce").fillna(100)
        df["items_per_100m"] = df["total_items"] / df["transect_m"] * 100
        df["beach_id"] = df["beach_id"].replace(BEACH_ID_MAP)
        beach_frames.append(df)
    except Exception as e:
        print(f"  ERROR {f.name}: {e}")

beach_df = pd.concat(beach_frames, ignore_index=True)
beach_df = beach_df.dropna(subset=["year","total_items"])
beach_df["year"]  = beach_df["year"].astype(int)
beach_df["month"] = pd.to_numeric(beach_df["month"], errors="coerce").astype("Int64")
beach_df["beach_name"] = beach_df["beach_name"].fillna(beach_df["beach_id"].map(BEACH_NAMES))

coords = beach_df.dropna(subset=["lat","lon"]).groupby("beach_id")[["lat","lon"]].first()
for idx, row in beach_df[beach_df["lat"].isna()].iterrows():
    if row["beach_id"] in coords.index:
        beach_df.at[idx,"lat"] = coords.loc[row["beach_id"],"lat"]
        beach_df.at[idx,"lon"] = coords.loc[row["beach_id"],"lon"]

beach_df.to_csv(OUT/"beach_litter.csv", index=False)
print(f"Beach: {len(beach_df)} surveys · {beach_df['beach_id'].nunique()} beaches · years {sorted(beach_df['year'].unique())}")

# ══════════════════════════════════════════════════════════════════════════════
# 2. FLOATING LITTER — Modulo_2bis
# ══════════════════════════════════════════════════════════════════════════════
MOD2BIS_DIR = LABENV / "Modulo_2bis_2020_Med_Occ_2018-2023"

STAZ_RENAME = {
    "NationalStationID":"station_id","NationalStationName":"station_name",
    "Latitude":"lat_station","Longitude":"lon_station",
    "Region":"region","SeaDepth":"depth_m",
}
MACROFLOT_NEW_RENAME = {
    "NationalStationID":"station_id","COD_Effort":"effort_id",
    "ID_Transect":"transect_id","Survey_N":"survey_n",
    "Latitude":"lat","Longitude":"lon",
    "Day":"day","Month":"month","Year":"year",
    "Material":"material","IDCategoriaRifiuto":"category",
    "Size":"size","Buoyancy":"buoyancy","Source_lit":"source",
    "Strip":"strip_width_m","Mean_speed":"speed_knots","Time_effective":"time_obs",
}
MACROFLOT_NEW_KEEP = [
    "station_id","effort_id","transect_id","survey_n",
    "lat","lon","day","month","year",
    "material","category","size","buoyancy","source",
    "strip_width_m","speed_knots","time_obs",
]
MACROFLOT_OLD_RENAME = {
    "NationalStationID":"station_id",
    "Latitude":"lat","Longitude":"lon",
    "ComposizioneLivI":"material","ComposizioneLivII":"category",
    "Grandezza":"size","Galleggiamento":"buoyancy","Sorgente":"source",
}
MACROFLOT_OLD_KEEP = ["station_id","lat","lon","material","category","size","buoyancy","source"]

float_frames = []
for f in sorted(MOD2BIS_DIR.glob("*.xl*")):
    engine = "xlrd" if f.suffix == ".xls" else "openpyxl"
    try:
        xl = pd.ExcelFile(f, engine=engine)
        sheets = xl.sheet_names
        stazioni = norm(xl.parse("Stazioni"), STAZ_RENAME,
                        ["station_id","station_name","lat_station","lon_station","region","depth_m"])

        if "MacroFlotCamp" in sheets:
            mf = norm(xl.parse("MacroFlotCamp"), MACROFLOT_NEW_RENAME, MACROFLOT_NEW_KEEP)
        elif "MacroplasticheFlotCamp" in sheets:
            m = re.search(r"(\d{4})_(\d{1,2})_", f.name)
            yr, mo = (int(m.group(1)), int(m.group(2))) if m else (None, None)
            mf = norm(xl.parse("MacroplasticheFlotCamp"), MACROFLOT_OLD_RENAME, MACROFLOT_OLD_KEEP)
            mf["year"]  = yr
            mf["month"] = mo
        else:
            continue

        df = mf.merge(stazioni, on="station_id", how="left")
        if "lat" in df.columns and "lat_station" in df.columns:
            df["lat"] = df["lat"].fillna(df["lat_station"])
            df["lon"] = df["lon"].fillna(df["lon_station"])
        float_frames.append(df)
    except Exception as e:
        print(f"  ERROR {f.name}: {e}")

float_df = pd.concat(float_frames, ignore_index=True)
float_df["material"] = float_df["material"].replace(MAT_MAP)
float_df["year"]  = pd.to_numeric(float_df["year"],  errors="coerce").astype("Int64")
float_df["month"] = pd.to_numeric(float_df["month"], errors="coerce").astype("Int64")
float_df.to_csv(OUT/"floating_litter.csv", index=False)
print(f"Floating: {len(float_df)} obs · {float_df['station_id'].nunique()} stations · years {sorted(float_df['year'].dropna().unique())}")
print(f"  % Plastic: {(float_df['material']=='Artificial polymer').sum()/float_df['material'].notna().sum()*100:.1f}% of classified")

print("\n=== BEACH pivot (items/100m mean) ===")
print(beach_df.pivot_table(index="beach_id",columns="year",values="items_per_100m",aggfunc="mean").round(0))
print("\n=== FLOATING obs by year ===")
print(float_df.groupby("year").size())
