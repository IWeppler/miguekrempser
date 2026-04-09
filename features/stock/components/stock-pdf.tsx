import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { type Product } from "@/features/stock/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 65,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  date: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    minHeight: 28,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    color: "#374151",
  },
  colName: { width: "45%", padding: 6 },
  colCategory: { width: "20%", padding: 6 },
  colLocation: { width: "20%", padding: 6 },
  colStock: {
    width: "15%",
    padding: 6,
    textAlign: "right",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface Props {
  readonly products: Product[];
}

export const StockDocument = ({ products }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reporte de Control Físico</Text>
          <Text style={styles.date}>Stock con disponibilidad en galpón</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.date}>Fecha de emisión:</Text>
          <Text style={{ fontWeight: "bold", marginTop: 2 }}>
            {format(new Date(), "dd/MM/yyyy HH:mm")}
          </Text>
        </View>
      </View>

      {/* Tabla de Productos */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.colName}>Producto</Text>
          <Text style={styles.colCategory}>Categoría</Text>
          <Text style={styles.colLocation}>Ubicación</Text>
          <Text style={styles.colStock}>Cantidad</Text>
        </View>

        {products.map((p, index) => (
          <View
            key={p.id}
            style={[
              styles.tableRow,
              index === products.length - 1 ? { borderBottomWidth: 0 } : {},
            ]}
          >
            <Text style={styles.colName}>{p.name}</Text>
            <Text style={styles.colCategory}>{p.category || "-"}</Text>
            <Text style={styles.colLocation}>{p.location || "-"}</Text>
            <Text style={styles.colStock}>
              {p.current_stock} {p.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* Pie de página con numeración */}
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages} - Generado automáticamente por el sistema`
        }
        fixed
      />
    </Page>
  </Document>
);
