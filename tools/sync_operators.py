"""
同步飞书中的“密探信息”到本地的 operators.json
"""

from typing import Any, Tuple

import feishu_common as fc

# 固定职业/子职业枚举，保持与前端 operators.json 结构一致
PROFESSIONS = [
    {
        "id": "混沌",
        "name": "混沌",
        "name_en": "混沌",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
    {
        "id": "地",
        "name": "地",
        "name_en": "地",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
    {
        "id": "水",
        "name": "水",
        "name_en": "水",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
    {
        "id": "火",
        "name": "火",
        "name_en": "火",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
    {
        "id": "风",
        "name": "风",
        "name_en": "风",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
    {
        "id": "阳",
        "name": "阳",
        "name_en": "阳",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
    {
        "id": "阴",
        "name": "阴",
        "name_en": "阴",
        "sub": [
            {"id": "pojun", "name": "破军", "name_en": "破军"},
            {"id": "longdun", "name": "龙盾", "name_en": "龙盾"},
            {"id": "qihuang", "name": "岐黄", "name_en": "岐黄"},
            {"id": "shenji", "name": "神纪", "name_en": "神纪"},
            {"id": "guidao", "name": "诡道", "name_en": "诡道"},
        ],
    },
]


def _get_text(value: Any) -> str:
    """
    宽松获取字段文本，兼容 str / list[dict[text]] / list[str] / None。
    """
    if isinstance(value, list):
        if value and isinstance(value[0], dict):
            return str(value[0].get("text", "")).strip()
        return ", ".join(str(v) for v in value if v is not None).strip()
    if isinstance(value, dict):
        return str(value.get("text", "")).strip()
    return str(value or "").strip()


def _get_single(value: Any) -> str:
    """
    针对单选字段的取值，默认返回第一个文本。
    """
    text = _get_text(value)
    if "," in text:
        return text.split(",")[0].strip()
    return text


def _to_int(value: Any) -> int:
    try:
        return int(str(value).strip())
    except Exception:
        return 0


def _pinyin_pair(name: str) -> Tuple[str, str]:
    """
    返回 (全拼, 首字母)。若缺少依赖则回退为原名。
    """
    try:
        from pypinyin import lazy_pinyin, Style

        full = "".join(lazy_pinyin(name, style=Style.NORMAL))
        initials = "".join(lazy_pinyin(name, style=Style.FIRST_LETTER))
        return full, initials
    except Exception:
            return name, name


def transform_operators(records: list, token: str) -> list:
    """
    将飞书多维表格的原始记录列表，转换为密探 JSON 数据结构。
    输出结构兼容 MaaYuan-Share-support 的导出格式：{ \"OPERATORS\": [...] }。
    """
    data: list[dict[str, Any]] = []
    for index, r in enumerate(records):
        f = r.get("fields", {})

        name = _get_text(f.get("密探名"))
        rarity = _to_int(_get_single(f.get("稀有度")))
        prof = _get_single(f.get("属性"))
        sub_prof = _get_single(f.get("职业"))

        discs = []
        for i in range(1, 19):
            disc = {}
            full = _get_text(f.get(f"命盘{i}（全称）"))
            abbr = _get_text(f.get(f"命盘{i}（四字）"))
            color = _get_single(f.get(f"命盘{i}稀有度"))
            desp = _get_text(f.get(f"命盘{i}描述"))

            if full:
                disc["ot_name"] = full
            if abbr:
                disc["abbreviation"] = abbr
            if color:
                disc["color"] = color
            if desp:
                disc["desp"] = desp

            # 仅在有有效字段时收录该命盘
            if disc:
                disc.setdefault("color", "金")  # 保底颜色，兼容解析
                discs.append(disc)

        py_full, py_initials = _pinyin_pair(name)
        alias = f"{py_full} {py_initials} “{name}” {name}".strip()
        seq = _to_int(_get_text(f.get("序号"))) or (index + 1)
        id_suffix = (py_full or name or "unknown").replace(" ", "").lower()
        op_id = f"char_{seq:03d}_{id_suffix}"

        data.append(
            {
                "id": op_id,
                "name": name,
                "name_en": name,
                "alias": alias,
                "alt_name": name,
                "rarity": rarity,
                "prof": prof,
                "subProf": sub_prof,
                "discs": discs,
            }
        )

    return data


def main():
    """主执行函数"""
    # 1. 获取 token
    token = fc.get_tenant_token()

    # 2. 提取 (Extract)
    operator_records = fc.fetch_records("operators", token)

    # 3. 转换 (Transform)
    operators_data = transform_operators(operator_records, token)

    # 4. 加载 (Load)
    fc.write_json_file(
        {
            "OPERATORS": operators_data,
            "PROFESSIONS": PROFESSIONS,
        },
        "operators.json",
    )


if __name__ == "__main__":
    main()
