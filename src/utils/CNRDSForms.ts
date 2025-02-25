 const CNRDSForms = {
     'JiBenXinXi':{
        "INFO_NAME": "string",
        "INFO_ID": "string",
        "INFO_FIRST_RRT_DATE": "string",
        "INFO_FIRST_RRT_GFR": null,
        "INFO_FIRST_RRT_SCR": null,
        "INFO_FIRST_RRT_ACC": "string",
        "INFO_FIRST_RRT_START": "string",
        "INFO_HEIGHT": null,
        "INFO_SEX": "string",
        "INFO_RACE": null,
        "INFO_MARRIAGE": null,
        "INFO_BIRTHDAY": "string",
        "INFO_EDU": null,
        "INFO_CAREER": null,
        "INFO_FEE": [],
        "INFO_RESID": {
            "INFO_RESID_PROVINCE": "string",
            "INFO_RESID_CITY": null,
            "INFO_RESID_COUNTY": null
        },
        "INFO_PHONE": "string"
    },
     'ZhuanGuiQingKuang':{
         "OUTCOME_STATUS_LATEST": "string",
         "OUTCOME_LIST": [
             {
                 "OUTCOME_STATUS": "string",
                 "OUTCOME_DATE": "string",
                 "OUTCOME_DEATH_CAUSE": null,
                 "OUTCOME_TRANSTO_PROVINCE": "string",
                 "OUTCOME_TRANSTO_CITY": "string",
                 "OUTCOME_TRANSTO_FACILITY": "string"
             }
         ]
     },
     'zhenDuanXinXi': {
             "PRICAU_TIME": {
                 "PRICAU_YEAR": "string"
             },
             "PRICAU_PRIMARY_CAUSE": "string",
             "PRICAU_PRIMARY_GD": null,
             "PRICAU_SECONDARY_GD": [
                 "string"
             ],
             "PRICAU_CONGENIAL": null,
             "PRICAU_TUBULOINTERSTITIAL": null,
             "PRICAU_DRUG_ASSO": null,
             "PRICAU_INFECT_STONE": null,
             "PATHO_YESNO": "string",
             "PATHO_TIME": {
                 "PATHO_YEAR": null
             },
             "PATHO_FL": null,
             "PATHO_PRIMARY_GD": null,
             "PATHO_SECONDARY_GD": null,
             "PATHO_CONGENIAL": null,
             "PATHO_TUBULOINTERSTITIAL": null
         },
     'TongLu':{
         "ACC_YEAR": "string",
         "ACC_DIMENSION": "string",
         "ACC_CHANGE_YN": "string",
         "ACC_TYPE": "string",
         "ACC_INITIAL_DATE": "string",
         "ACC_POSITION_LR": "string",
         "ACC_POSITION_CATHETER": null,
         "ACC_POSITION_FISTULA": "string",
         "ACC_FIRST_YN": false
     },
     'TouXiChuFang':{
         "DIA_YEAR": "string",
         "DIA_DIMENSION": "string",
         "DIA_CHANGE_YN": null,
         "DIA_FREQ": "string",
         "DIA_DURATION": "string",
         "DIA_HDF_YN": "string",
         "DIA_HDF_FREQ": null,
         "DIA_HP_YN": "string",
         "DIA_HP_FREQ": null,
         "DIA_DIALYSATE": "string",
         "DIA_DIALYSATE_CENTRAL": null,
         "DIA_DIALYSATE_CENTRAL_K": null,
         "DIA_DIALYSATE_CENTRAL_CA": null,
         "DIA_DIALYSATE_CENTRAL_HCO": null,
         "DIA_DIALYSATE_A": "string",
         "DIA_DIALYSATE_A_K": "string",
         "DIA_DIALYSATE_A_CA": "string",
         "DIA_DIALYSATE_A_GLU": "string",
         "DIA_DIALYSATE_B": "string",
         "DIA_DIALYZER_TYPE": [
             "string"
         ],
         "DIA_DIALYZER_FLUX": "string",
         "DIA_DIALYZER_MEM": "string",
         "DIA_DIALYZER_AREA": "string",
         "DIA_FIRST_YN": true
     },
     'KangNingJi':{
         "ANTICO_YEAR": "string",
         "ANTICO_DIMENSION": "string",
         "ANTICO_CHANGE_YN": null,
         "ANTICO_AGENT": "string",
         "ANTICO_HEPARIN": {
             "ANTICO_HEPARIN_INITIAL": null,
             "ANTICO_HEPARIN_INITIAL_UNIT": null,
             "ANTICO_HEPARIN_INFUSION_RATE": null,
             "ANTICO_HEPARIN_INFUSION_HR": null,
             "ANTICO_HEPARIN_INFUSION_MIN": null
         },
         "ANTICO_LMWH": {
             "ANTICO_LMWH_TYPE": null,
             "ANTICO_LMWH_DOSE": null,
             "ANTICO_LMWH_UNIT": null
         },
         "ANTICO_CITRATE": {
             "ANTICO_CITRATE_CONCENTRATION": null,
             "ANTICO_CITRATE_OTHER": null,
             "ANTICO_CITRATE_RATE": null,
             "ANTICO_CITRATE_HR": null,
             "ANTICO_CITRATE_MIN": null
         },
         "ANTICO_ARGATRO": {
             "ANTICO_ARGATRO_INITIAL": null,
             "ANTICO_ARGATRO_INITIAL_UNIT": null,
             "ANTICO_ARGATRO_INFUSION_RATE": null,
             "ANTICO_ARGATRO_INFUSION_HR": null,
             "ANTICO_ARGATRO_INFUSION_MIN": null
         },
         "ANTICO_FIRST_YN": true
     },
     'XueYaCeLiang':{
         "BP_YEAR": "string",
         "BP_DIMENSION": "string",
         "BP_POSITION": "string",
         "BP_HYPERTENSION": "string",
         "BP_HYPOTENSION": "string",
         "BP_PRESBP": "string",
         "BP_PREDBP": "string",
         "BP_POSSBP": null,
         "BP_POSDBP": null,
         "BP_NDSBP": null,
         "BP_NDDBP": null
     },
     'TouXiChongFenXing':{
         "ADEQ_YEAR": "string",
         "ADEQ_DIMENSION": "string",
         "ADEQ_WEIGHT_CONDITION": "string",
         "ADEQ_WEIGHT_VALUE": "string",
         "ADEQ_WEIGHT_ASSESSMENT": "string",
         "ADEQ_NONSYS_FLAG": "string",
         "ADEQ_PREUREA": "string",
         "ADEQ_POSUREA": "string",
         "ADEQ_DURATION": "string",
         "ADEQ_UF": "string",
         "ADEQ_URR": null,
         "ADEQ_KTV": null
     },
     'CuHongSu':{
         "ESA_YEAR": "string",
         "ESA_DIMENSION": "string",
         "ESA_CHANGE_YN": null,
         "ESA_TREATMENT": "",
         "ESA_TYPE": null,
         "ESA_MANUFACTURER": null,
         "ESA_ADMIN": null,
         "ESA_DOSE": {
             "ESA_DOSE_WEEK": null,
             "ESA_DOSE_UNIT": null
         },
         "ESA_FIRST_YN": false
     },
     'HIF-PHI':{
         "HIF_YEAR": "string",
         "HIF_DIMENSION": "string",
         "HIF_CHANGE_YN": null,
         "HIF_TREATMENT": "string",
         "HIF_FIRST_YN": true
     },
     'TieJi':{
         "FE_YEAR": "string",
         "FE_DIMENSION": "string",
         "FE_CHANGE_YN": null,
         "FE_TREATMENT": "string",
         "FE_ADMIN": [
             "string"
         ],
         "FE_TYPE_ORAL": "string",
         "FE_TYPE_INTRAVENOUS": "string",
         "FE_FIRST_YN": true
     },
     'KangGaoXueYa':{
         "ANTIHT_AGENT_YEAR": "string",
         "ANTIHT_AGENT_DIMENSION": "string",
         "ANTIHT_AGENT_CHANGE_YN": null,
         "ANTIHT_AGENT_TREATMENT": "string",
         "ANTIHT_AGENT_TYPE": [
             "string"
         ],
         "ANTIHT_AGENT_FIRST_YN": true
     },
     'kangGuKuangWuZhiDaiXie':{
         "MBD_YEAR": "string",
         "MBD_DIMENSION": "string",
         "MBD_CHANGE_YN": null,
         "MBD_TREATMENT": "string",
         "MBD_VITD_TREATMENT": null,
         "MBD_VITD_TYPE": null,
         "MBD_CA_BASED_P_BINDER_TR": null,
         "MBD_CA_BASED_P_BINDER": null,
         "MBD_NON_CA_BASED_P_BINDER_TR": null,
         "MBD_NON_CA_BASED_P_BINDER": null,
         "MBD_CASR": null,
         "MBD_OTHERS": null,
         "MBD_FIRST_YN": true
     },
     'ShiYanShiJianCha':{
         "LAB_YEAR": "string",
         "LAB_DIMENSION": "string",
         "LAB_BLOOD_RT_YN": null,
         "LAB_BLOOD_RT_HB": "string",
         "LAB_BLOOD_RT_RBC": "",
         "LAB_BLOOD_RT_HCT": "",
         "LAB_BLOOD_RT_PLT": "",
         "LAB_IRON_TEST_TS_YN": null,
         "LAB_IRON_TEST_TS": "string",
         "LAB_IRON_TEST_SF_YN": null,
         "LAB_IRON_TEST_SF": "string",
         "LAB_ROD_CAP_YN": null,
         "LAB_ROD_CA": "string",
         "LAB_ROD_P": "string",
         "LAB_ROD_PTH_YN": null,
         "LAB_ROD_PTH": "string",
         "LAB_BIOCHEMICAL_YN": null,
         "LAB_BIOCHEMICAL_UREA": "string",
         "LAB_BIOCHEMICAL_UREA_UNIT": "string",
         "LAB_BIOCHEMICAL_SCR": "string",
         "LAB_BIOCHEMICAL_SCR_UNIT": "string",
         "LAB_BIOCHEMICAL_UA": "",
         "LAB_BIOCHEMICAL_ALB": "string",
         "LAB_BIOCHEMICAL_AST": "",
         "LAB_BIOCHEMICAL_ALT": "",
         "LAB_BIOCHEMICAL_STB": "",
         "LAB_BIOCHEMICAL_TG": "",
         "LAB_BIOCHEMICAL_TC": "",
         "LAB_BIOCHEMICAL_LDL": "",
         "LAB_BIOCHEMICAL_HDL": "",
         "LAB_BIOCHEMICAL_GLU": "",
         "LAB_BIOCHEMICAL_POTASSIUM": "",
         "LAB_BIOCHEMICAL_SODIUM": "",
         "LAB_NUTR_INFLAM_CRP_YN": "string",
         "LAB_NUTR_INFLAM_CRP": null,
         "LAB_NUTR_INFLAM_PAB_YN": "string",
         "LAB_NUTR_INFLAM_PAB": null,
         "LAB_NUTR_INFLAM_BETA2MG_YN": "string",
         "LAB_NUTR_INFLAM_BETA2MG": null,
         "LAB_INFECT_HBSAG_YN": "string",
         "LAB_INFECT_HBSAG": null,
         "LAB_INFECT_ANTIHCV_YN": "string",
         "LAB_INFECT_ANTIHCV": null,
         "LAB_INFECT_HIV_YN": "string",
         "LAB_INFECT_HIV": null,
         "LAB_INFECT_SYPHILIS_YN": "string",
         "LAB_INFECT_SYPHILIS": null
     },
     'FuZhuJianCha':{
         "EXAM_YEAR": "string",
         "EXAM_DIMENSION": "string",
         "EXAM_XRAY_YN": "string",
         "EXAM_XRAY_CTP": null,
         "EXAM_XRAY_DIAGNOSIS": null,
         "EXAM_ECG_YN": "string",
         "EXAM_ECG_DIAGNOSIS": null,
         "EXAM_UCG_YN": "string",
         "EXAM_UCG_EF": null,
         "EXAM_UCG_PE": null,
         "EXAM_UCG_LA_ENLARGEMENT": null,
         "EXAM_UCG_RA_ENLARGEMENT": null,
         "EXAM_UCG_LV_ENLARGEMENT": null,
         "EXAM_UCG_RV_ENLARGEMENT": null,
         "EXAM_UCG_LVW_THICKEN": null,
         "EXAM_UCG_IVS_THICKEN": null,
         "EXAM_UCG_LV_DIASTOLIC": null,
         "EXAM_UCG_MV_CALCIFICATION": null,
         "EXAM_UCG_MV_REGURGITATION": null,
         "EXAM_UCG_TV_REGURGITATION": null,
         "EXAM_UCG_AV_REGURGITATION": null
     }
 }
 export default CNRDSForms;