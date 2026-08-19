# -*- coding: utf-8 -*-
"""Generate expanded public-TM PoC JSON (18 scenarios). Run from backend/."""
from __future__ import annotations

import json
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[1] / "app" / "data"
FE_DIR = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data"

DISCLAIMER = (
    "DEMO / Public Technical Manual Reference only. Excerpts from publicly available "
    "CH-47D US Army TM 55-1520-240-T series. NOT Surion (수리온) procedures. "
    "pdf_page = 1-based local PDF page index (not printed page)."
)


def src(manual, doc, title, pdf_page, task):
    return {
        "manual_id": manual,
        "document_id": doc,
        "title": title,
        "page": pdf_page,  # compat = pdf_page
        "pdf_page": pdf_page,
        "task": task,
        "paragraph": task,  # compat
        "printed_page": None,
    }


COMPONENT_LABELS = {
    "PRESSURE_SENSOR": "오일 압력 센서(Pressure Transmitter)",
    "OIL_FILTER": "오일 필터",
    "OIL_PUMP": "오일 펌프",
    "ENGINE_ZONE": "엔진 계통",
    "HYDRAULIC_ZONE": "비행조종 유압계통",
    "ELECTRICAL_ZONE": "발전기·전기계통",
    "XMSN_ZONE": "변속기 계통",
    "FUEL_ZONE": "연료계통",
    "UNKNOWN": "관련 계통",
}

TD_SENTENCE = {
    "COMPONENT": "관련 장비 위치를 3D 모델에 표시했습니다.",
    "SYSTEM": "관련 계통의 위치를 3D 모델에 표시했습니다.",
    "AREA": "관련 장비가 위치한 영역을 3D 모델에 표시했습니다.",
    "PENDING": "현재 3D 모델에서 해당 위치를 표시할 수 없습니다.",
}


def label_comps(codes: list[str]) -> str:
    return "\n".join(COMPONENT_LABELS.get(c, c) for c in codes)


def natural_answer(
    opening: str,
    body: str,
    next_check: str,
    related_heading: str,
    related_items: list[str],
    manual: str,
    task: str,
    pdf_page: int,
    td_grade: str,
    related_override: str | None = None,
) -> str:
    related = related_override or label_comps(related_items)
    td = TD_SENTENCE.get(td_grade, "관련 위치를 3D 모델에 표시했습니다.")
    return (
        f"{opening}\n\n"
        f"{body}\n\n"
        f"{next_check}\n\n"
        f"{related_heading}\n{related}\n\n"
        f"정비교범 근거\n{manual}\nTask {task} · PDF p.{pdf_page}\n\n"
        f"3D 위치\n{td}\n\n"
        f"※ 공개 Technical Manual 기반 시제품용 DEMO 데이터이며 실제 수리온 정비절차가 아닙니다."
    )


# Per-chunk natural copy (user-facing). Keys = chunk id.
NATURAL: dict[str, dict] = {
    "CH47-TM-T2-ENG-OIL-001": {
        "opening": "엔진 오일 압력 지시 계통부터 확인하는 것이 좋습니다.",
        "body": (
            "공개 정비교범 기준으로는 먼저 1·2번 엔진의 OIL PRESS 회로 차단기(Circuit Breaker) 상태를 확인하고, "
            "이후 엔진을 GROUND IDLE로 운용한 상태에서 오일 압력 지시값이 정상적으로 나타나는지 점검합니다. "
            "공개 CH-47D 교범 해당 단계에서는 지시값이 약 20 psi 이상이며 과도한 변동이 없어야 합니다."
        ),
        "next": (
            "압력값이 기준에서 벗어나거나 변동이 크다면 오일 압력 센서(Pressure Transmitter), "
            "오일 라인 및 관련 배선 상태를 순서대로 확인합니다. 이상이 지속되면 관련 고장탐구 절차로 이어서 점검할 수 있습니다."
        ),
        "heading": "관련 장비",
        "related_override": "오일 압력 센서 및 연결계통",
    },
    "CH47-TM-T1-OIL-FILTER-001": {
        "opening": "오일 필터 상태를 우선 확인하는 것이 좋습니다.",
        "body": (
            "공개 정비교범의 변속기 윤활계통 육안점검에서는 오일 필터 indicating button이 돌출되어 있으면 "
            "필터 엘리먼트를 교체하고, 제거한 엘리먼트의 이물질(debris) 여부를 확인하도록 안내합니다."
        ),
        "next": "오일 레벨과 누유, 쿨러 막힘 등 인접 항목도 함께 확인한 뒤 필요 시 정비교범(TM 55-1520-240-23)을 참조합니다.",
        "heading": "관련 장비",
    },
    "CH47-TM-T2-HYD-PRESS-001": {
        "opening": "먼저 비행조종 유압계통의 압력 지시 상태를 확인해 보겠습니다.",
        "body": (
            "공개 정비교범 기준으로는 유압 압력 지시용 회로 차단기 상태를 확인한 뒤, "
            "비행조종 유압 압력 지시값이 정상 범위에 있는지 점검합니다. "
            "해당 공개 교범 단계에서는 대략 2500–3500 psi 범위와 과도 변동 여부를 확인합니다."
        ),
        "next": "지시값이 범위를 벗어나거나 변동이 크면 관련 고장탐구 절차로 이어 점검합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T2-GEN-001": {
        "opening": "발전기와 전기계통 연결 상태부터 확인하는 것이 좋습니다.",
        "body": (
            "공개 정비교범의 교류 전원(AC Power) 고장증상 목록에서는 발전기 OFF/주의(GEN) 관련 증상을 "
            "확인하고, 이어서 발전기 스위치와 발전기 제어패널(Generator Control Panel) 상태를 육안으로 점검하도록 안내합니다."
        ),
        "next": "스위치·패널·커넥터·배선에 손상이나 풀림이 있으면 조이거나 교체한 뒤 정비교범을 참조합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T1-XMSN-HOT-001": {
        "opening": "변속기 오일 온도(고온 경고) 관련 점검을 우선 진행하는 것이 좋습니다.",
        "body": (
            "공개 정비교범 구동계통 고장증상 목록에서는 XMSN OIL HOT(변속기 오일 고온) 경고가 점등되고 "
            "일부 변속기 오일 온도 지시가 높은 경우, 해당 윤활계통 점검 경로로 안내합니다."
        ),
        "next": "필요하면 온도 지시·경고계통 점검을 병행하고, 정비 조치는 정비교범을 참조합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T2-ENG-OIL-TEMP-001": {
        "opening": "엔진 오일 온도 지시 계통부터 확인해 보겠습니다.",
        "body": "공개 정비교범의 엔진 오일 온도 지시계통 운용점검에 따라 관련 회로 차단기와 온도 지시 상태를 확인합니다.",
        "next": "지시가 비정상일 경우 해당 고장탐구 절차로 이어서 점검합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T2-ENG-OIL-CB-001": {
        "opening": "엔진 오일 압력용 회로 차단기 상태부터 확인하는 것이 좋습니다.",
        "body": (
            "공개 정비교범 고장증상 목록에는 OIL PRESS 회로 차단기가 닫힌 상태를 유지하지 못하는 항목이 있으며, "
            "운용점검 중 차단기가 다시 열리면 관련 고장탐구 절차로 안내합니다."
        ),
        "next": "차단기·배선 이상 여부를 확인한 뒤 필요 시 정비교범을 참조합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T1-XMSN-PRESS-001": {
        "opening": "변속기 오일 압력 저하 경고에 대해 윤활계통 점검을 우선 권고합니다.",
        "body": (
            "공개 정비교범에서는 XMSN OIL PRESS 경고와 함께 일부 변속기 오일 압력 지시가 낮은 경우 "
            "고장분리 절차를 수행하며, 그 과정에서 메인 오일 필터 교체 및 변속기 사용성 점검이 안내됩니다."
        ),
        "next": "필터 교체 후에도 압력이 회복되지 않으면 펌프·쿨러 등 후속 점검 경로를 따릅니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T1-HYD-FILTER-BTN-001": {
        "opening": "비행조종 유압 필터 지시 상태를 먼저 확인해 보겠습니다.",
        "body": (
            "공개 정비교범에서는 비행조종 유압의 압력/리턴 필터 indicating button이 돌출된 경우 "
            "해당 필터 관련 고장분리 절차를 수행하도록 안내합니다."
        ),
        "next": "필터 상태 확인 후 필요 시 정비교범에 따라 조치합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T1-HYD-FILTER-LIGHT-001": {
        "opening": "비행조종 유압 필터 교체 지시등 점등부터 확인해 보겠습니다.",
        "body": "공개 정비교범에서는 비행조종 1번 압력/리턴 필터 교체 지시등이 켜진 경우 관련 고장분리 절차를 안내합니다.",
        "next": "해당 필터 점검·교체 여부와 지시등 회로를 확인합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T2-FUEL-QTY-001": {
        "opening": "연료량 지시 계통부터 확인해 보겠습니다.",
        "body": (
            "공개 정비교범의 연료량 지시계통 운용점검에서는 관련 회로 차단기 상태를 확인하고, "
            "선택 스위치 위치에 따른 연료량 지시가 정상적인지 점검합니다."
        ),
        "next": "지시가 맞지 않으면 해당 고장탐구 절차로 이어갑니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T3-FUEL-BOOST-001": {
        "opening": "연료 부스트 펌프 계통부터 확인해 보겠습니다.",
        "body": "공개 정비교범의 연료 부스트 펌프 운용점검에 따라 관련 회로 차단기와 펌프 스위치 동작 상태를 확인합니다.",
        "next": "펌프가 정상 동작하지 않으면 관련 고장탐구 및 정비교범을 참조합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T2-DC-POWER-001": {
        "opening": "배터리·DC 전원 계통 상태부터 확인해 보겠습니다.",
        "body": (
            "공개 정비교범의 DC 전원 운용점검에서는 배터리 스위치 투입 시 주의등 및 "
            "정류기(RECT) OFF 관련 지시 거동을 확인하도록 안내합니다."
        ),
        "next": "이상 시 DC 전원 관련 고장탐구 절차로 이어 점검합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T1-XMSN-CHIP-001": {
        "opening": "변속기 칩 탐지(Chip Detector) 계통부터 확인해 보겠습니다.",
        "body": "공개 정비교범의 변속기 칩 탐지·debris screen 운용점검에 따라 표시기와 탐지기 설치 상태를 확인합니다.",
        "next": "경고/표시가 비정상이면 관련 고장탐구 절차로 이어갑니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T1-ENG-CHIP-001": {
        "opening": "엔진 액세서리 기어박스 칩 탐지 상태부터 확인해 보겠습니다.",
        "body": "공개 정비교범의 엔진 액세서리 기어박스 칩 탐지기 운용점검 절차에 따라 관련 상태를 확인합니다.",
        "next": "이상 시 해당 고장탐구 및 정비교범을 참조합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T3-FUEL-SYS-OVERVIEW-001": {
        "opening": "연료 펌프 회로 차단기 상태부터 확인해 보겠습니다.",
        "body": (
            "공개 정비교범 연료계통 고장증상 목록에는 연료 펌프 관련 회로 차단기가 "
            "닫힌 상태를 유지하지 못하는 항목이 있으며, 부스트 펌프 육안·운용점검으로 이어집니다."
        ),
        "next": "차단기·스위치·펌프 상태를 확인한 뒤 필요 시 정비교범을 참조합니다.",
        "heading": "관련 계통",
    },
    "CH47-TM-T2-ELEC-OVERVIEW-001": {
        "opening": "전기계통(DC/AC 전원) 전반부터 구분해 확인해 보겠습니다.",
        "body": "공개 정비교범 전기계통 장에서는 DC 전원과 AC 전원(발전기) 점검을 구분해 안내합니다. 증상에 맞는 하위 점검을 선택합니다.",
        "next": "발전기 관련이면 AC 전원, 배터리·정류기 관련이면 DC 전원 점검을 우선합니다.",
        "heading": "관련 계통",
    },
}


def answer_for_chunk(c: dict, related_codes: list[str]) -> str:
    n = NATURAL[c["id"]]
    return natural_answer(
        n["opening"],
        n["body"],
        n["next"],
        n["heading"],
        related_codes,
        c["source_manual"],
        c["task"],
        c["pdf_page"],
        c.get("td_grade", "SYSTEM"),
        n.get("related_override"),
    )


def answer(judgement, causes, steps, parts, source_lines, td_line):  # legacy unused
    return ""


# ---- chunks (18) ----
chunks = []

def add_chunk(**kw):
    chunks.append(kw)


# 1 existing oil press
add_chunk(
    id="CH47-TM-T2-ENG-OIL-001",
    document_id="CH47-TM-T2-ENG-OIL-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="Engine Oil Pressure Indicating — Operational Check",
    chapter="8",
    section="Engine Oil Pressure Indicating System",
    page=114,
    pdf_page=114,
    printed_page=None,
    paragraph="8-3.3",
    task="8-3.3",
    system_code="ENGINE_OIL",
    subsystem="LUBRICATION_INDICATING",
    symptom_codes=["ENG_OIL_PRESS_LOW", "LOW_OIL_PRESSURE"],
    symptom_ko="엔진 오일 압력 저하(지시 이상)",
    symptom_en="No. 1 Engine Oil Press Indicator Does Not Indicate 20 PSI Minimum",
    possible_causes=[
        "OIL PRESS 회로 차단기(Circuit Breaker)가 열려 있거나 유지되지 않음",
        "오일 압력 지시기 이상",
        "오일 압력 센서(Transmitter)·오일 라인·배선 이상(육안점검 경로)",
    ],
    recommended_steps=[
        "1·2번 엔진 OIL PRESS 회로 차단기 닫힘 상태 확인",
        "GROUND IDLE에서 오일 압력 지시값이 정상인지 확인(공개 교범 기준 약 20 psi 이상, 과도 변동 없음)",
        "비정상 시 오일 압력 센서·오일 라인·배선 상태 확인",
        "이상이 지속되면 관련 고장탐구 절차로 진행",
    ],
    component_codes=["PRESSURE_SENSOR"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 8-3.3: GROUND IDLE 20 psi 미만 또는 5 psi 초과 변동 시 8-3.6 고장분리.",
    original_text="8-3.3 ENGINE OIL PRESSURE INDICATING SYSTEM OPERATIONAL CHECK. Have pilot operate No. 1 engine to GROUND IDLE. Indicator shall indicate 20 psi minimum with pointer fluctuations less than 5 psi. If below 20 psi or fluctuating more than 5 psi, go to task 8-3.6 or 8-3.6.1.",
    keywords=["oil pressure", "20 psi", "GROUND IDLE", "8-3.3", "오일 압력", "엔진 오일", "경고"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="COMPONENT",
    td_grade="COMPONENT",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T1-OIL-FILTER-001",
    document_id="CH47-TM-T1-OIL-FILTER-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="Transmission Lubrication — Oil Filter Indicating Button",
    chapter="6",
    section="Transmission Lubrication Systems",
    page=577,
    pdf_page=577,
    printed_page=None,
    paragraph="6-1.2",
    task="6-1.2",
    system_code="ENGINE_OIL",
    subsystem="TRANSMISSION_LUBRICATION",
    symptom_codes=["OIL_FILTER_CONTAMINATION", "OIL_FILTER_BYPASS"],
    symptom_ko="오일 필터 오염/바이패스(지시 버튼 돌출)",
    symptom_en="Oil filter indicating button extended",
    possible_causes=[
        "오일 필터 엘리먼트 막힘/오염",
        "제거한 필터 엘리먼트 내 이물질(debris)",
    ],
    recommended_steps=[
        "오일 필터 indicating button 상태 확인",
        "버튼 돌출 시 필터 엘리먼트 교체 및 이물질 검사(TM 55-1520-240-23 참조)",
        "오일 레벨·누유·쿨러 막힘 등 인접 항목 확인",
    ],
    component_codes=["OIL_FILTER"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 6-1.2: indicating button 돌출 시 필터 교체 및 이물질 검사.",
    original_text="6-1.2 Check oil filter indicating button (5). If button (5) is extended, replace filter element and inspect removed element for debris. Refer to TM 55-1520-240-23.",
    keywords=["oil filter", "indicating button", "debris", "6-1.2", "오일 필터", "오염"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="COMPONENT",
    td_grade="COMPONENT",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

add_chunk(
    id="CH47-TM-T2-HYD-PRESS-001",
    document_id="CH47-TM-T2-HYD-PRESS-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="Hydraulic Pressure Indicating — Operational Check",
    chapter="8",
    section="Hydraulic Pressure Indicating System",
    page=227,
    pdf_page=227,
    printed_page=None,
    paragraph="8-7.3",
    task="8-7.3",
    system_code="HYDRAULIC",
    subsystem="FLT_CONT_HYDRAULICS",
    symptom_codes=["HYD_PRESS_LOW", "HYD_PRESS_OUT_OF_RANGE"],
    symptom_ko="비행조종 유압 압력 지시 이상",
    symptom_en="FLT CONT Hydraulics Pressure Indicator out of 2500–3500 PSI",
    possible_causes=[
        "유압 압력 지시용 회로 차단기(Circuit Breaker)가 열려 있음",
        "비행조종 유압 압력 지시계통 이상",
    ],
    recommended_steps=[
        "유압 압력 지시용 회로 차단기 닫힘 상태 확인",
        "공개 교범 기준으로 압력 지시값이 약 2500–3500 psi 범위인지·과도 변동이 없는지 확인",
        "범위 이탈 시 관련 고장탐구 절차로 진행",
    ],
    component_codes=["HYDRAULIC_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 8-7.3: 유압압력 지시 2500–3500 psi 범위 점검.",
    original_text="8-7.3 HYDRAULIC PRESSURE INDICATING SYSTEM OPERATIONAL CHECK. Indicator shall indicate 2500 to 3500 psi and pointer shall not fluctuate more than 100 psi. If not, go to task 8-7.5.",
    keywords=["hydraulic pressure", "2500", "3500", "8-7.3", "유압", "압력"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM HYDRAULIC_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T2-GEN-001",
    document_id="CH47-TM-T2-GEN-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="AC Power / Generator Caution — Symptom & Visual Check",
    chapter="9",
    section="AC Power System",
    page=492,
    pdf_page=492,
    printed_page=None,
    paragraph="9-2.4",
    task="9-2.4",
    system_code="ELECTRICAL",
    subsystem="AC_POWER",
    symptom_codes=["GEN_OFF", "GEN_FAIL"],
    symptom_ko="발전기 OFF/주의등(GEN capsule) 이상",
    symptom_en="No. 1 or No. 2 Generator OFF Capsule / GEN Capsule",
    possible_causes=[
        "발전기 스위치 또는 발전기 제어패널 풀림·손상",
        "발전기 제어패널 배선·커넥터 이상",
    ],
    recommended_steps=[
        "교류 전원(AC Power) 고장증상 목록에서 발전기 OFF/GEN 관련 증상 확인",
        "GEN NO.1·NO.2·APU 스위치 및 발전기 제어패널 육안 점검",
        "손상된 커넥터·배선은 조이거나 교체 후 정비교범(TM 55-1520-240-23) 참조",
    ],
    component_codes=["ELECTRICAL_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Chapter 9 AC Power: GEN/GENERATOR OFF → Task 9-2.4, 육안 9-2.3.",
    original_text="AC POWER SYSTEM: NO. 1 OR NO. 2 GENERATOR OFF CAPSULE ... 9-2.4. Task 9-2.3: Check GEN NO. 1, NO. 2, and APU switches; check generator control panels.",
    keywords=["generator", "GEN", "AC power", "9-2.4", "발전기"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM ELECTRICAL_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T1-XMSN-HOT-001",
    document_id="CH47-TM-T1-XMSN-HOT-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="Transmission Oil Hot — Failure Symptom List",
    chapter="6",
    section="Transmission Lubrication Systems",
    page=569,
    pdf_page=569,
    printed_page=None,
    paragraph="6-1.3",
    task="6-1.3",
    system_code="DRIVE_SYSTEM",
    subsystem="TRANSMISSION_LUBRICATION",
    symptom_codes=["XMSN_OIL_HOT", "XMSN_OIL_TEMP_HIGH"],
    symptom_ko="변속기 오일 온도 고온(XMSN OIL HOT)",
    symptom_en="XMSN OIL HOT Capsule On, One Transmission Oil Temperature Indication High",
    possible_causes=[
        "변속기 윤활계통 이상",
        "온도 지시·경고계통 이상",
    ],
    recommended_steps=[
        "XMSN OIL HOT(변속기 오일 고온) 경고와 온도 지시 상태 확인",
        "변속기 윤활계통 운용·육안 점검 수행",
        "필요 시 온도 지시·경고계통 점검을 병행",
    ],
    component_codes=["XMSN_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Ch.6: XMSN OIL HOT capsule → Task 6-1.3.",
    original_text="XMSN OIL HOT CAPSULE ON, ONE TRANSMISSION OIL TEMPERATURE INDICATION HIGH 6-1.3",
    keywords=["XMSN OIL HOT", "transmission", "6-1.3", "변속기", "오일 온도", "고온"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM XMSN_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

# NEW scenarios
add_chunk(
    id="CH47-TM-T2-ENG-OIL-TEMP-001",
    document_id="CH47-TM-T2-ENG-OIL-TEMP-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="Engine Oil Temperature Indicating — Operational Check",
    chapter="8",
    section="Engine Oil Temperature Indicating System",
    page=140,
    pdf_page=140,
    printed_page=None,
    paragraph="8-4.3",
    task="8-4.3",
    system_code="ENGINE_OIL",
    subsystem="OIL_TEMP_INDICATING",
    symptom_codes=["ENG_OIL_TEMP_ABNORMAL"],
    symptom_ko="엔진 오일 온도 지시 이상",
    symptom_en="Engine Oil Temperature Indicating System Operational Check",
    possible_causes=[
        "ENGINE OIL TEMP 회로 차단기가 열려 있음",
        "엔진 오일 온도 지시계통 이상",
    ],
    recommended_steps=[
        "엔진 오일 온도 지시계통 운용점검 수행",
        "관련 회로 차단기 및 온도 지시값 확인",
        "이상 시 관련 고장탐구 절차로 진행",
    ],
    component_codes=["ENGINE_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 8-4.3 엔진 오일온도 지시계통 운용점검.",
    original_text="8-4.3 ENGINE OIL TEMPERATURE INDICATING SYSTEM OPERATIONAL CHECK. INITIAL SETUP References: TM 55-1520-240-23. Equipment Condition / Tools per task setup.",
    keywords=["oil temperature", "8-4.3", "ENGINE OIL TEMP", "오일 온도"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="AREA ENGINE_ZONE",
    td_grade="AREA",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T2-ENG-OIL-CB-001",
    document_id="CH47-TM-T2-ENG-OIL-CB-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="Engine Oil Press Circuit Breaker Will Not Stay Closed",
    chapter="8",
    section="Engine Oil Pressure Indicating System",
    page=44,
    pdf_page=44,
    printed_page=None,
    paragraph="8-3.3",
    task="8-3.3",
    system_code="ENGINE_OIL",
    subsystem="LUBRICATION_INDICATING",
    symptom_codes=["ENG_OIL_PRESS_CB"],
    symptom_ko="엔진 오일 압력 차단기 유지 불량",
    symptom_en="ENGINE OIL PRESS Circuit Breaker Does Not Stay Closed",
    possible_causes=[
        "OIL PRESS 회로 차단기 자체 이상",
        "단락 등으로 차단기가 다시 열리는 배선 이상",
    ],
    recommended_steps=[
        "OIL PRESS 회로 차단기가 닫힌 상태를 유지하는지 확인",
        "운용점검 중 차단기가 다시 열리면 관련 고장탐구 절차로 진행",
    ],
    component_codes=["ENGINE_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Symptom list: OIL PRESS CB does not stay closed → Task 8-3.3/8-3.4.",
    original_text="ENGINE OIL PRESS CIRCUIT BREAKER DOES NOT STAY CLOSED 8-3.3",
    keywords=["circuit breaker", "OIL PRESS", "8-3.3", "차단기"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="AREA ENGINE_ZONE",
    td_grade="AREA",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T1-XMSN-PRESS-001",
    document_id="CH47-TM-T1-XMSN-PRESS-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="XMSN Oil Press Capsule On — One Indication Low",
    chapter="6",
    section="Transmission Lubrication Systems",
    page=581,
    pdf_page=581,
    printed_page=None,
    paragraph="6-1.4",
    task="6-1.4",
    system_code="DRIVE_SYSTEM",
    subsystem="TRANSMISSION_LUBRICATION",
    symptom_codes=["XMSN_OIL_PRESS_LOW"],
    symptom_ko="변속기 오일 압력 저하(XMSN OIL PRESS)",
    symptom_en="XMSN OIL PRESS Capsule On And One Transmission Oil Pressure Indication Low",
    possible_causes=[
        "메인 오일 필터 오염",
        "오일 펌프 릴리프 밸브·쿨러·메인 오일 펌프 이상",
    ],
    recommended_steps=[
        "변속기 오일 압력 저하에 대한 고장분리 절차 착수",
        "메인 오일 필터 교체 및 변속기 사용성 점검(TM 55-1520-240-23 참조)",
        "압력이 회복되지 않으면 펌프·쿨러 등 후속 점검 경로 확인",
    ],
    component_codes=["XMSN_ZONE", "OIL_FILTER"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 6-1.4: XMSN OIL PRESS capsule + one indication low.",
    original_text="6-1.4 XMSN OIL PRESS CAPSULE ON AND ONE TRANSMISSION OIL PRESSURE INDICATION LOW FAULT ISOLATION PROCEDURE. REPLACE MAIN OIL FILTER PERFORM TRANSMISSION SERVICEABILITY CHECK REFER TO TM 55-1520-240-23.",
    keywords=["XMSN OIL PRESS", "6-1.4", "transmission oil pressure", "변속기 오일 압력"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM XMSN_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

add_chunk(
    id="CH47-TM-T1-HYD-FILTER-BTN-001",
    document_id="CH47-TM-T1-HYD-FILTER-BTN-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="Flight Control Hydraulic Filter Indicating Button Extended",
    chapter="7",
    section="Flight Control Hydraulic System",
    page=679,
    pdf_page=679,
    printed_page=None,
    paragraph="7-1.6",
    task="7-1.6",
    system_code="HYDRAULIC",
    subsystem="FLT_CONT_HYDRAULICS",
    symptom_codes=["HYD_FILTER_BUTTON"],
    symptom_ko="비행조종 유압 필터 지시버튼 돌출",
    symptom_en="Indicating Button On Flight Control Hydraulic Pressure Or Return Filter Is Extended",
    possible_causes=[
        "압력/리턴 필터 막힘 또는 교체 시기",
        "필터 지시 기구 이상",
    ],
    recommended_steps=[
        "비행조종 유압 필터 indicating button 돌출에 대한 고장분리 절차 수행",
        "해당 압력/리턴 필터 상태 확인 후 정비교범(TM 55-1520-240-23) 참조",
    ],
    component_codes=["HYDRAULIC_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 7-1.6: FLT CONT hydraulic filter indicating button extended.",
    original_text="7-1.6 INDICATING BUTTON ON FLIGHT CONTROL HYDRAULIC PRESSURE OR RETURN FILTER IS EXTENDED FAULT ISOLATION PROCEDURE.",
    keywords=["hydraulic filter", "indicating button", "7-1.6", "유압 필터"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM HYDRAULIC_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

add_chunk(
    id="CH47-TM-T1-HYD-FILTER-LIGHT-001",
    document_id="CH47-TM-T1-HYD-FILTER-LIGHT-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="Flight Control No.1 Filter Change Light On",
    chapter="7",
    section="Flight Control Hydraulic System",
    page=708,
    pdf_page=708,
    printed_page=None,
    paragraph="7-1.17",
    task="7-1.17",
    system_code="HYDRAULIC",
    subsystem="FLT_CONT_HYDRAULICS",
    symptom_codes=["HYD_FILTER_CHANGE_LIGHT"],
    symptom_ko="비행조종 1번 필터 교체 지시등 점등",
    symptom_en="Flight Control No. 1 Pressure Or Return Filter Change Light Is On",
    possible_causes=[
        "1번 압력/리턴 필터 교체 필요",
        "필터 교체 지시등 회로 이상",
    ],
    recommended_steps=[
        "비행조종 1번 필터 교체 지시등 관련 고장분리 절차 진행",
        "해당 필터 점검·교체 및 정비교범(TM 55-1520-240-23) 참조",
    ],
    component_codes=["HYDRAULIC_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 7-1.17: FLT CONT No.1 filter change light ON.",
    original_text="7-1.17 FLIGHT CONTROL NO. 1 PRESSURE OR RETURN FILTER CHANGE LIGHT IS ON.",
    keywords=["filter change light", "7-1.17", "유압", "필터 교체"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM HYDRAULIC_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

add_chunk(
    id="CH47-TM-T2-FUEL-QTY-001",
    document_id="CH47-TM-T2-FUEL-QTY-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="Fuel Quantity Indicating — Operational Check",
    chapter="8",
    section="Fuel Quantity Indicating System",
    page=379,
    pdf_page=379,
    printed_page=None,
    paragraph="8-11.3",
    task="8-11.3",
    system_code="FUEL",
    subsystem="FUEL_QUANTITY",
    symptom_codes=["FUEL_QTY_WRONG"],
    symptom_ko="연료량 지시 이상",
    symptom_en="Fuel Quantity Indicating System Operational Check / Wrong Indication",
    possible_causes=[
        "FUEL QTY DC 회로 차단기가 열려 있음",
        "연료량 지시계통 이상",
    ],
    recommended_steps=[
        "연료량 지시계통 운용점검 수행",
        "FUEL QTY DC 회로 차단기 닫힘 상태 확인",
        "선택 스위치 위치별 지시 확인 후 이상 시 관련 고장탐구로 진행",
    ],
    component_codes=["FUEL_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 8-11.3 연료량 지시계통 운용점검.",
    original_text="8-11.3 FUEL QUANTITY INDICATING SYSTEM OPERATIONAL CHECK. Check that FUEL QTY DC circuit breaker (1) is closed.",
    keywords=["fuel quantity", "8-11.3", "FUEL QTY", "연료량", "연료"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM FUEL_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T3-FUEL-BOOST-001",
    document_id="CH47-TM-T3-FUEL-BOOST-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-3",
    title="Fuel Boost Pump System — Operational Check",
    chapter="10",
    section="Fuel Boost Pump System",
    page=87,
    pdf_page=87,
    printed_page=None,
    paragraph="10-2.3",
    task="10-2.3",
    system_code="FUEL",
    subsystem="FUEL_BOOST",
    symptom_codes=["FUEL_BOOST_FAULT"],
    symptom_ko="연료 부스트 펌프 계통 이상",
    symptom_en="Fuel Boost Pump System Operational Check",
    possible_causes=[
        "연료 부스트 펌프 회로 차단기가 열려 있음",
        "부스트 펌프 또는 제어 스위치 이상",
    ],
    recommended_steps=[
        "연료 부스트 펌프 계통 운용점검 수행",
        "좌·우 MAIN/AUX 연료 펌프 회로 차단기 및 스위치 상태 확인",
        "이상 시 관련 고장탐구 및 정비교범(TM 55-1520-240-23) 참조",
    ],
    component_codes=["FUEL_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 10-2.3 연료 부스트 펌프 운용점검.",
    original_text="10-2.3 FUEL BOOST PUMP SYSTEM OPERATIONAL CHECK. INITIAL SETUP References: TM 55-1520-240-10 / TM 55-1520-240-23.",
    keywords=["fuel boost", "fuel pump", "10-2.3", "부스트 펌프", "연료 펌프"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM FUEL_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-3.pdf",
)

add_chunk(
    id="CH47-TM-T2-DC-POWER-001",
    document_id="CH47-TM-T2-DC-POWER-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="DC Power System — Operational Check",
    chapter="9",
    section="DC Power System",
    page=527,
    pdf_page=527,
    printed_page=None,
    paragraph="9-1.4",
    task="9-1.4",
    system_code="ELECTRICAL",
    subsystem="DC_POWER",
    symptom_codes=["DC_POWER_FAULT", "RECT_OFF"],
    symptom_ko="DC 전원/정류기(RECT OFF) 계통 이상",
    symptom_en="DC Power System Operational Check / RECT OFF Capsules",
    possible_causes=[
        "배터리·외부전원 구성 이상",
        "정류기(RECT) OFF 관련 지시 경로 이상",
    ],
    recommended_steps=[
        "DC 전원 계통 운용점검 수행",
        "배터리 스위치 투입 시 MASTER CAUTION 및 RECT OFF 지시 거동 확인",
        "이상 시 DC 전원 관련 고장탐구 절차로 진행",
    ],
    component_codes=["ELECTRICAL_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 9-1.4 DC Power 운용점검 (BATT/RECT OFF).",
    original_text="9-1.4 DC POWER SYSTEM OPERATIONAL CHECK. Set BATT switch (14) to ON. MASTER CAUTION lights (15) shall come on. NO. 1 RECT OFF and NO. 2 RECT OFF ...",
    keywords=["DC power", "RECT OFF", "battery", "9-1.4", "배터리", "정류기", "DC"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM ELECTRICAL_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

add_chunk(
    id="CH47-TM-T1-XMSN-CHIP-001",
    document_id="CH47-TM-T1-XMSN-CHIP-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="Transmission Chip Detectors — Operational Check",
    chapter="6",
    section="Transmission Chip Detectors",
    page=597,
    pdf_page=597,
    printed_page=None,
    paragraph="6-2.3",
    task="6-2.3",
    system_code="DRIVE_SYSTEM",
    subsystem="CHIP_DETECTION",
    symptom_codes=["XMSN_CHIP_DET"],
    symptom_ko="변속기 칩 탐지(CHIP DET) 이상",
    symptom_en="Transmission Chip Detectors And Debris Screens Operational Check",
    possible_causes=[
        "칩 탐지기(Chip Detector)·debris screen 지시 이상",
        "배선 또는 경보등 회로 이상",
    ],
    recommended_steps=[
        "변속기 칩 탐지·debris screen 운용점검 수행",
        "GND/RESET 및 각 변속기 칩 탐지기 설치 상태 확인",
        "이상 시 관련 고장탐구 절차로 진행",
    ],
    component_codes=["XMSN_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 6-2.3 변속기 칩 탐지/debris screen 운용점검.",
    original_text="6-2.3 TRANSMISSION CHIP DETECTORS AND DEBRIS SCREENS OPERATIONAL CHECK.",
    keywords=["chip detector", "6-2.3", "XMSN CHIP", "칩", "debris"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM XMSN_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

add_chunk(
    id="CH47-TM-T1-ENG-CHIP-001",
    document_id="CH47-TM-T1-ENG-CHIP-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-1",
    title="Engine Accessory Gearbox Chip Detectors — Operational Check",
    chapter="4",
    section="Engine Accessory Gearbox Chip Detectors",
    page=407,
    pdf_page=407,
    printed_page=None,
    paragraph="4-7.3",
    task="4-7.3",
    system_code="ENGINE_OIL",
    subsystem="ENGINE_CHIP",
    symptom_codes=["ENG_CHIP_DET"],
    symptom_ko="엔진 액세서리 기어박스 칩 탐지 이상",
    symptom_en="Engine Accessory Gearbox Chip Detectors Operational Check",
    possible_causes=[
        "엔진 액세서리 기어박스 칩 탐지기 이상",
        "관련 지시 회로 이상",
    ],
    recommended_steps=[
        "엔진 액세서리 기어박스 칩 탐지기 운용점검 수행",
        "이상 시 관련 고장탐구 및 정비교범(TM 55-1520-240-23) 참조",
    ],
    component_codes=["ENGINE_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Task 4-7.3 엔진 액세서리 기어박스 칩 탐지 운용점검.",
    original_text="4-7.3 ENGINE ACCESSORY GEARBOX CHIP DETECTORS OPERATIONAL CHECK.",
    keywords=["chip detector", "gearbox", "4-7.3", "엔진 칩", "기어박스"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="AREA ENGINE_ZONE",
    td_grade="AREA",
    pdf_file="TM_55-1520-240-T-1.pdf",
)

add_chunk(
    id="CH47-TM-T3-FUEL-SYS-OVERVIEW-001",
    document_id="CH47-TM-T3-FUEL-SYS-OVERVIEW-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-3",
    title="Fuel Systems Troubleshooting — Chapter Overview / Pump CB Symptoms",
    chapter="10",
    section="Fuel Systems",
    page=41,
    pdf_page=41,
    printed_page=None,
    paragraph="10-2",
    task="10-2",
    system_code="FUEL",
    subsystem="FUEL_SYSTEM",
    symptom_codes=["FUEL_PUMP_CB"],
    symptom_ko="연료 펌프 차단기 유지 불량",
    symptom_en="LH Fuel Pump AUX/MAIN Circuit Breaker Will Not Stay Closed",
    possible_causes=[
        "연료 펌프 회로 차단기 이상",
        "연료 펌프 제어회로 단락·과부하",
    ],
    recommended_steps=[
        "연료계통 고장증상 목록에서 해당 연료 펌프 차단기 증상 확인",
        "육안점검 및 운용점검으로 펌프·스위치 상태 확인",
    ],
    component_codes=["FUEL_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Ch.10 Fuel: LH FUEL PUMP ... CIRCUIT BREAKER WILL NOT STAY CLOSED 등 증상목록.",
    original_text="CHAPTER 10 FUEL SYSTEMS TROUBLESHOOTING. SYMPTOM: LH FUEL PUMP AUX AFT CIRCUIT BREAKER WILL NOT STAY CLOSED; LH FUEL PUMPS AUX FWD CIRCUIT BREAKER WILL NOT STAY CLOSED.",
    keywords=["fuel pump", "circuit breaker", "chapter 10", "연료 펌프", "차단기"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM FUEL_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-3.pdf",
)

add_chunk(
    id="CH47-TM-T2-ELEC-OVERVIEW-001",
    document_id="CH47-TM-T2-ELEC-OVERVIEW-001",
    manual_type="T",
    source_manual="TM 55-1520-240-T-2",
    title="Electrical System Troubleshooting — Chapter Overview",
    chapter="9",
    section="Electrical System",
    page=491,
    pdf_page=491,
    printed_page=None,
    paragraph="9-1",
    task="9-1",
    system_code="ELECTRICAL",
    subsystem="ELECTRICAL_SYSTEM",
    symptom_codes=["ELEC_SYSTEM_FAULT"],
    symptom_ko="전기계통 종합 이상(DC/AC Power)",
    symptom_en="Electrical System Troubleshooting Chapter Overview (DC/AC Power)",
    possible_causes=[
        "DC 전원계통 이상",
        "AC 전원(발전기) 계통 이상",
    ],
    recommended_steps=[
        "전기계통에서 DC 전원과 AC 전원을 구분해 해당 경로 선택",
        "증상에 맞는 육안·운용점검으로 진행",
    ],
    component_codes=["ELECTRICAL_ZONE"],
    warning_cautions=[],
    content="[DEMO/Public TM] Ch.9 Electrical: DC POWER SYSTEM 9-1, AC POWER SYSTEM 9-2.",
    original_text="CHAPTER 9 ELECTRICAL SYSTEM TROUBLESHOOTING. SYSTEM PARA: DC POWER SYSTEM 9-1; AC POWER SYSTEM 9-2.",
    keywords=["electrical", "DC power", "AC power", "chapter 9", "전기"],
    language="en",
    is_dummy=False,
    is_demo_public_tm=True,
    td_mapping="SYSTEM ELECTRICAL_ZONE",
    td_grade="SYSTEM",
    pdf_file="TM_55-1520-240-T-2.pdf",
)

assert len(chunks) >= 15, len(chunks)
print("chunk_count", len(chunks))

manual = {
    "version": "1.2",
    "disclaimer": DISCLAIMER,
    "aircraft_demo": "DEMO_HELICOPTER_CH47_PUBLIC_TM",
    "chunks": chunks,
}

# ---- demo responses ----
# map chunk id -> demo meta
demos_spec = [
    ("DEMO-PUB-ENG-OIL-001", "CH47-TM-T2-ENG-OIL-001", ["오일 압력", "엔진 오일", "1번 엔진"], ["오일 압력 경고", "오일 압력이 낮", "oil pressure", "어디를 확인"], "ENGINE_PRESSURE_SENSOR", "FAULT_AREA01_PART01", "AREA_01", "AREA_01_PART_01", "AREA_01_COVER_01", "AREA_01_CHECK_01", "HIGH", 0.93, "ENG_OIL_PRESS_LOW", ["PRESSURE_SENSOR"]),
    ("DEMO-PUB-OIL-FILTER-001", "CH47-TM-T1-OIL-FILTER-001", ["오일 필터", "필터 오염"], ["필터 버튼", "oil filter", "이물질"], "ENGINE_OIL_FILTER", "FAULT_AREA01_PART01", "AREA_01", "AREA_01_PART_01", "AREA_01_COVER_01", "AREA_01_CHECK_01", "HIGH", 0.9, "OIL_FILTER_CONTAMINATION", ["OIL_FILTER"]),
    ("DEMO-PUB-HYD-001", "CH47-TM-T2-HYD-PRESS-001", ["유압", "유압 압력"], ["hydraulic", "하이드로릭", "flight control pressure"], "HYDRAULIC_SYSTEM", "FAULT_HYD_SYSTEM", None, None, None, None, "HIGH", 0.88, "HYD_PRESS_LOW", ["HYDRAULIC_ZONE"]),
    ("DEMO-PUB-GEN-001", "CH47-TM-T2-GEN-001", ["발전기", "제너레이터"], ["generator", "GEN capsule", "GEN OFF"], "ELECTRICAL_SYSTEM", "FAULT_ELEC_SYSTEM", None, None, None, None, "MEDIUM", 0.86, "GEN_OFF", ["ELECTRICAL_ZONE"]),
    ("DEMO-PUB-XMSN-HOT-001", "CH47-TM-T1-XMSN-HOT-001", ["변속기", "오일 온도", "XMSN"], ["transmission oil", "OIL HOT", "고온"], "DRIVE_SYSTEM_VIEW", "FAULT_XMSN_SYSTEM", None, None, None, None, "HIGH", 0.87, "XMSN_OIL_HOT", ["XMSN_ZONE"]),
    ("DEMO-PUB-ENG-OIL-TEMP-001", "CH47-TM-T2-ENG-OIL-TEMP-001", ["오일 온도", "엔진 오일 온도"], ["oil temperature", "오일온도"], "ENGINE_OIL_SYSTEM", "FAULT_AREA01_PART01", "AREA_01", "AREA_01_PART_01", "AREA_01_COVER_01", "AREA_01_CHECK_01", "MEDIUM", 0.85, "ENG_OIL_TEMP_ABNORMAL", ["ENGINE_ZONE"]),
    ("DEMO-PUB-ENG-OIL-CB-001", "CH47-TM-T2-ENG-OIL-CB-001", ["오일 압력 차단기", "OIL PRESS 차단"], ["circuit breaker", "차단기가 떨어"], "ENGINE_OIL_SYSTEM", "FAULT_AREA01_PART01", "AREA_01", "AREA_01_PART_01", "AREA_01_COVER_01", "AREA_01_CHECK_01", "MEDIUM", 0.84, "ENG_OIL_PRESS_CB", ["ENGINE_ZONE"]),
    ("DEMO-PUB-XMSN-PRESS-001", "CH47-TM-T1-XMSN-PRESS-001", ["변속기 오일 압력", "XMSN OIL PRESS"], ["transmission oil pressure", "변속 압력"], "DRIVE_SYSTEM_VIEW", "FAULT_XMSN_SYSTEM", None, None, None, None, "HIGH", 0.88, "XMSN_OIL_PRESS_LOW", ["XMSN_ZONE", "OIL_FILTER"]),
    ("DEMO-PUB-HYD-FILTER-BTN-001", "CH47-TM-T1-HYD-FILTER-BTN-001", ["유압 필터", "필터 버튼"], ["hydraulic filter", "indicating button"], "HYDRAULIC_SYSTEM", "FAULT_HYD_SYSTEM", None, None, None, None, "MEDIUM", 0.85, "HYD_FILTER_BUTTON", ["HYDRAULIC_ZONE"]),
    ("DEMO-PUB-HYD-FILTER-LIGHT-001", "CH47-TM-T1-HYD-FILTER-LIGHT-001", ["필터 교체등", "필터 체인지"], ["filter change light", "교체 지시등"], "HYDRAULIC_SYSTEM", "FAULT_HYD_SYSTEM", None, None, None, None, "MEDIUM", 0.84, "HYD_FILTER_CHANGE_LIGHT", ["HYDRAULIC_ZONE"]),
    ("DEMO-PUB-FUEL-QTY-001", "CH47-TM-T2-FUEL-QTY-001", ["연료량", "연료 지시"], ["fuel quantity", "연료게이지"], "FUEL_SYSTEM_VIEW", "FAULT_FUEL_SYSTEM", None, None, None, None, "MEDIUM", 0.85, "FUEL_QTY_WRONG", ["FUEL_ZONE"]),
    ("DEMO-PUB-FUEL-BOOST-001", "CH47-TM-T3-FUEL-BOOST-001", ["부스트 펌프", "연료 펌프"], ["fuel boost", "fuel pump", "부스트"], "FUEL_SYSTEM_VIEW", "FAULT_FUEL_SYSTEM", None, None, None, None, "MEDIUM", 0.86, "FUEL_BOOST_FAULT", ["FUEL_ZONE"]),
    ("DEMO-PUB-DC-001", "CH47-TM-T2-DC-POWER-001", ["배터리", "DC 전원", "정류기"], ["RECT OFF", "battery", "DC power"], "ELECTRICAL_SYSTEM", "FAULT_ELEC_SYSTEM", None, None, None, None, "MEDIUM", 0.85, "DC_POWER_FAULT", ["ELECTRICAL_ZONE"]),
    ("DEMO-PUB-XMSN-CHIP-001", "CH47-TM-T1-XMSN-CHIP-001", ["칩 탐지", "CHIP DET"], ["chip detector", "debris screen", "칩"], "DRIVE_SYSTEM_VIEW", "FAULT_XMSN_SYSTEM", None, None, None, None, "HIGH", 0.86, "XMSN_CHIP_DET", ["XMSN_ZONE"]),
    ("DEMO-PUB-ENG-CHIP-001", "CH47-TM-T1-ENG-CHIP-001", ["엔진 칩", "기어박스 칩"], ["accessory gearbox", "engine chip"], "ENGINE_OIL_SYSTEM", "FAULT_AREA01_PART01", "AREA_01", "AREA_01_PART_01", "AREA_01_COVER_01", "AREA_01_CHECK_01", "HIGH", 0.84, "ENG_CHIP_DET", ["ENGINE_ZONE"]),
    ("DEMO-PUB-FUEL-CB-001", "CH47-TM-T3-FUEL-SYS-OVERVIEW-001", ["연료 펌프 차단기"], ["fuel pump circuit", "펌프 차단"], "FUEL_SYSTEM_VIEW", "FAULT_FUEL_SYSTEM", None, None, None, None, "MEDIUM", 0.82, "FUEL_PUMP_CB", ["FUEL_ZONE"]),
    ("DEMO-PUB-ELEC-001", "CH47-TM-T2-ELEC-OVERVIEW-001", ["전기계통", "전기 이상"], ["electrical system", "전기 시스템"], "ELECTRICAL_SYSTEM", "FAULT_ELEC_SYSTEM", None, None, None, None, "LOW", 0.8, "ELEC_SYSTEM_FAULT", ["ELECTRICAL_ZONE"]),
    # 18th: reuse oil indicator zero from symptom list as dedicated demo
]

# Add 18th chunk already have 18 chunks; demos_spec has 17 - add one more demo for oil press indicator 0
# Actually 17 demos + we need 18 - add ENG oil indicator does not indicate 0 as alias of first or separate

chunks_by_id = {c["id"]: c for c in chunks}

# Add 18th demo linking to ENG-OIL-001 with different keywords for "지시가 0이 아니야"
demos_spec.append(
    ("DEMO-PUB-ENG-OIL-ZERO-001", "CH47-TM-T2-ENG-OIL-001", ["오일 압력 지시", "압력계"], ["indicate 0", "지시가 0", "압력 게이지"], "ENGINE_PRESSURE_SENSOR", "FAULT_AREA01_PART01", "AREA_01", "AREA_01_PART_01", "AREA_01_COVER_01", "AREA_01_CHECK_01", "MEDIUM", 0.83, "ENG_OIL_PRESS_INDICATOR", ["PRESSURE_SENSOR"]),
)

responses = []
for spec in demos_spec:
    (
        demo_id,
        chunk_id,
        kws,
        kw_alt,
        view,
        fault,
        area,
        target,
        cover,
        insp,
        risk,
        conf,
        symptom,
        comps,
    ) = spec
    c = chunks_by_id[chunk_id]
    s = src(c["source_manual"], c["document_id"], c["title"], c["pdf_page"], c["task"])
    # Prefer demo-spec components (display/3D alignment); fall back to chunk
    related = comps if comps else c.get("component_codes", [])
    # Sync chunk component_codes for oil-press indicating path
    if chunk_id == "CH47-TM-T2-ENG-OIL-001":
        c["component_codes"] = ["PRESSURE_SENSOR"]
        related = ["PRESSURE_SENSOR"]
    resp = {
        "system_code": c["system_code"],
        "symptom_code": symptom,
        "risk_level": risk,
        "suspected_components": related,
        "answer": answer_for_chunk(c, related),
        "manual_ids": [chunk_id],
        "recommended_steps": c["recommended_steps"],
        "view_target_id": view,
        "confidence": conf,
        "is_demo": True,
        "sources": [s],
        "td_grade": c.get("td_grade"),
    }
    if fault:
        resp["fault_code"] = fault
    if area:
        resp["area_id"] = area
        resp["target_mesh"] = target
        resp["cover_mesh"] = cover
        resp["inspection_point"] = insp
    responses.append(
        {
            "id": demo_id,
            "keywords": kws,
            "keywords_alt": kw_alt,
            "response": resp,
        }
    )

demo = {
    "version": "1.2",
    "disclaimer": DISCLAIMER,
    "responses": responses,
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "dummy_manual.json").write_text(
    json.dumps(manual, ensure_ascii=False, indent=2), encoding="utf-8"
)
(OUT_DIR / "demo_responses.json").write_text(
    json.dumps(demo, ensure_ascii=False, indent=2), encoding="utf-8"
)
FE_DIR.mkdir(parents=True, exist_ok=True)
(FE_DIR / "demoResponses.json").write_text(
    json.dumps(demo, ensure_ascii=False, indent=2), encoding="utf-8"
)
(FE_DIR / "publicManualChunks.json").write_text(
    json.dumps(manual, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("chunks", len(chunks), "demos", len(responses))
print("wrote", OUT_DIR)
