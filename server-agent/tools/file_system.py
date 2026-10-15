FILE_TREE = {
    "name": "Home",
    "type": "folder",
    "children": [
        {
            "name": "Documents",
            "type": "folder",
            "children": [
                {"name": "CV.pdf", "type": "file"},
                {"name": "internship.pdf", "type": "file"},
                {"name": "report.docx", "type": "file"},
            ],
        },
        {
            "name": "Downloads",
            "type": "folder",
            "children": [{"name": "wallpaper.jpg", "type": "file"}],
        },
        {
            "name": "Pictures",
            "type": "folder",
            "children": [{"name": "screenshot.png", "type": "file"}],
        },
    ],
}


def _segments(raw: str) -> list[str]:
    return [s.strip() for s in raw.replace("\\", "/").split("/") if s.strip()]


def resolve_path(raw: str):
    """Case-insensitive lookup. Returns (canonical_path, node) or None."""
    segments = _segments(raw)
    if segments and segments[0].lower() == FILE_TREE["name"].lower():
        segments = segments[1:]

    node = FILE_TREE
    canonical = [FILE_TREE["name"]]
    for segment in segments:
        match = next(
            (c for c in node.get("children", []) if c["name"].lower() == segment.lower()),
            None,
        )
        if match is None:
            return None
        canonical.append(match["name"])
        node = match

    return canonical, node


def find_file_anywhere(name: str):
    """Finds a file by bare name anywhere in the tree. Returns its path or None."""
    target = name.strip().lower()

    def walk(node, path):
        for child in node.get("children", []):
            child_path = path + [child["name"]]
            if child["type"] == "file" and child["name"].lower() == target:
                return child_path
            if child["type"] == "folder":
                found = walk(child, child_path)
                if found:
                    return found
        return None

    return walk(FILE_TREE, [FILE_TREE["name"]])


def describe_tree() -> str:
    lines = [FILE_TREE["name"] + "/"]

    def walk(node, depth):
        for child in node.get("children", []):
            suffix = "/" if child["type"] == "folder" else ""
            lines.append("  " * depth + child["name"] + suffix)
            if child["type"] == "folder":
                walk(child, depth + 1)

    walk(FILE_TREE, 1)
    return "\n".join(lines)