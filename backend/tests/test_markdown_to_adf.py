"""Tests for the markdown-to-ADF converter used in Jira ticket creation."""

from app.services.jira_service import _markdown_to_adf, _inline_marks


class TestInlineMarks:

    def test_plain_text(self):
        nodes = _inline_marks("hello world")
        assert nodes == [{"type": "text", "text": "hello world"}]

    def test_bold(self):
        nodes = _inline_marks("hello **bold** world")
        assert len(nodes) == 3
        assert nodes[1] == {"type": "text", "text": "bold", "marks": [{"type": "strong"}]}

    def test_italic(self):
        nodes = _inline_marks("hello *italic* world")
        assert len(nodes) == 3
        assert nodes[1] == {"type": "text", "text": "italic", "marks": [{"type": "em"}]}

    def test_inline_code(self):
        nodes = _inline_marks("run `npm install` now")
        assert len(nodes) == 3
        assert nodes[1] == {"type": "text", "text": "npm install", "marks": [{"type": "code"}]}

    def test_bold_italic(self):
        nodes = _inline_marks("***important***")
        assert nodes[0]["marks"] == [{"type": "strong"}, {"type": "em"}]


class TestMarkdownToAdf:

    def test_returns_doc_type(self):
        adf = _markdown_to_adf("hello")
        assert adf["type"] == "doc"
        assert adf["version"] == 1

    def test_paragraph(self):
        adf = _markdown_to_adf("Just a paragraph.")
        assert adf["content"][0]["type"] == "paragraph"
        assert adf["content"][0]["content"][0]["text"] == "Just a paragraph."

    def test_heading_h1(self):
        adf = _markdown_to_adf("# Title")
        node = adf["content"][0]
        assert node["type"] == "heading"
        assert node["attrs"]["level"] == 1
        assert node["content"][0]["text"] == "Title"

    def test_heading_h3(self):
        adf = _markdown_to_adf("### Sub-heading")
        node = adf["content"][0]
        assert node["attrs"]["level"] == 3

    def test_bullet_list(self):
        md = "- item one\n- item two\n- item three"
        adf = _markdown_to_adf(md)
        bl = adf["content"][0]
        assert bl["type"] == "bulletList"
        assert len(bl["content"]) == 3
        assert bl["content"][0]["type"] == "listItem"

    def test_ordered_list(self):
        md = "1. first\n2. second"
        adf = _markdown_to_adf(md)
        ol = adf["content"][0]
        assert ol["type"] == "orderedList"
        assert len(ol["content"]) == 2

    def test_horizontal_rule(self):
        adf = _markdown_to_adf("---")
        assert adf["content"][0]["type"] == "rule"

    def test_mixed_content(self):
        md = "# Title\n\nSome text.\n\n- bullet a\n- bullet b\n\n---\n\nParagraph after rule."
        adf = _markdown_to_adf(md)
        types = [node["type"] for node in adf["content"]]
        assert types == ["heading", "paragraph", "bulletList", "rule", "paragraph"]

    def test_empty_string_produces_valid_doc(self):
        adf = _markdown_to_adf("")
        assert adf["type"] == "doc"
        assert len(adf["content"]) >= 1

    def test_bold_inside_list_item(self):
        md = "- **bold item**"
        adf = _markdown_to_adf(md)
        item_content = adf["content"][0]["content"][0]["content"][0]["content"]
        assert any(
            n.get("marks") == [{"type": "strong"}] for n in item_content
        )
