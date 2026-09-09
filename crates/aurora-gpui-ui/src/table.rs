use aurora_gpui_core::AuroraTheme;
use gpui::{ElementId, IntoElement, RenderOnce, SharedString, div, prelude::*, px};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TableColumn {
    pub key: SharedString,
    pub label: SharedString,
    pub width: Option<u16>,
}
impl TableColumn {
    pub fn new(key: impl Into<SharedString>, label: impl Into<SharedString>) -> Self {
        Self {
            key: key.into(),
            label: label.into(),
            width: None,
        }
    }
    #[must_use]
    pub const fn width(mut self, value: u16) -> Self {
        self.width = Some(value);
        self
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TableRow {
    pub id: SharedString,
    pub cells: Vec<SharedString>,
}
impl TableRow {
    pub fn new(
        id: impl Into<SharedString>,
        cells: impl IntoIterator<Item = impl Into<SharedString>>,
    ) -> Self {
        Self {
            id: id.into(),
            cells: cells.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TableValidationError {
    pub row: SharedString,
    pub expected: usize,
    pub actual: usize,
}

#[must_use]
pub fn validate_rows(columns: &[TableColumn], rows: &[TableRow]) -> Vec<TableValidationError> {
    rows.iter()
        .filter(|row| row.cells.len() != columns.len())
        .map(|row| TableValidationError {
            row: row.id.clone(),
            expected: columns.len(),
            actual: row.cells.len(),
        })
        .collect()
}

#[derive(IntoElement)]
pub struct Table {
    id: ElementId,
    columns: Vec<TableColumn>,
    rows: Vec<TableRow>,
    label: SharedString,
    theme: AuroraTheme,
}
impl Table {
    pub fn new(id: impl Into<ElementId>) -> Self {
        Self {
            id: id.into(),
            columns: vec![],
            rows: vec![],
            label: "Table".into(),
            theme: AuroraTheme::default(),
        }
    }
    #[must_use]
    pub fn columns(mut self, value: impl IntoIterator<Item = TableColumn>) -> Self {
        self.columns = value.into_iter().collect();
        self
    }
    #[must_use]
    pub fn rows(mut self, value: impl IntoIterator<Item = TableRow>) -> Self {
        self.rows = value.into_iter().collect();
        self
    }
    #[must_use]
    pub fn label(mut self, value: impl Into<SharedString>) -> Self {
        self.label = value.into();
        self
    }
    #[must_use]
    pub const fn theme(mut self, value: AuroraTheme) -> Self {
        self.theme = value;
        self
    }
}

impl RenderOnce for Table {
    fn render(self, _: &mut gpui::Window, _: &mut gpui::App) -> impl IntoElement {
        let colors = self.theme.colors;
        let columns = self.columns;
        let column_count = columns.len();
        div()
            .id(self.id)
            .role(gpui::Role::Table)
            .aria_label(self.label)
            .aria_row_count(self.rows.len() + 1)
            .aria_column_count(column_count)
            .flex()
            .flex_col()
            .rounded(px(self.theme.radii.md))
            .border_1()
            .border_color(colors.border)
            .overflow_hidden()
            .child(
                div()
                    .id("table-header")
                    .role(gpui::Role::Row)
                    .flex()
                    .bg(gpui::Hsla::from(colors.surface_active))
                    .children(columns.iter().enumerate().map(|(index, column)| {
                        div()
                            .id(("column", index))
                            .role(gpui::Role::ColumnHeader)
                            .aria_column_index(index)
                            .px(px(self.theme.space.md))
                            .py(px(self.theme.space.sm))
                            .text_color(colors.text)
                            .when_some(column.width, |element, width| {
                                element.w(px(f32::from(width))).flex_none()
                            })
                            .when(column.width.is_none(), gpui::Styled::flex_1)
                            .child(column.label.clone())
                    })),
            )
            .children(self.rows.into_iter().enumerate().map(|(row_index, row)| {
                let cells = (0..column_count)
                    .map(|index| row.cells.get(index).cloned().unwrap_or_default());
                div()
                    .id(row.id)
                    .role(gpui::Role::Row)
                    .aria_row_index(row_index + 1)
                    .flex()
                    .border_t_1()
                    .border_color(colors.border)
                    .hover(|style| style.bg(gpui::Hsla::from(colors.surface_hover)))
                    .children(cells.enumerate().map(|(index, cell)| {
                        div()
                            .id(SharedString::from(format!("cell-{row_index}-{index}")))
                            .role(gpui::Role::Cell)
                            .aria_column_index(index)
                            .px(px(self.theme.space.md))
                            .py(px(self.theme.space.sm))
                            .text_color(colors.text)
                            .when_some(columns[index].width, |element, width| {
                                element.w(px(f32::from(width))).flex_none()
                            })
                            .when(columns[index].width.is_none(), gpui::Styled::flex_1)
                            .child(cell)
                    }))
            }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_mismatched_rows() {
        let columns = [TableColumn::new("a", "A"), TableColumn::new("b", "B")];
        let rows = [TableRow::new("1", ["a"])];
        assert_eq!(
            validate_rows(&columns, &rows),
            vec![TableValidationError {
                row: "1".into(),
                expected: 2,
                actual: 1
            }]
        );
    }
    #[test]
    fn valid_rows_have_no_errors() {
        let columns = [TableColumn::new("a", "A")];
        let rows = [TableRow::new("1", ["a"])];
        assert!(validate_rows(&columns, &rows).is_empty());
    }
}
