"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { RemitoSchema } from "@/features/moves/schemas/remito-schema";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica", color: "#222" },
  headerBox: {
    borderWidth: 1,
    borderColor: "#000",
    flexDirection: "row",
    marginBottom: 10,
  },
  headerLeft: {
    padding: 10,
    width: "60%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    justifyContent: "center",
  },
  headerRight: {
    padding: 10,
    width: "40%",
    justifyContent: "center",
  },
  companyName: { fontSize: 16, fontWeight: "bold", textTransform: "uppercase" },
  docTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  label: { fontSize: 8, color: "#666", marginBottom: 1 },
  value: { fontSize: 10, marginBottom: 4, fontWeight: "bold" },

  // Sección Transporte
  sectionBox: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#eee",
    padding: 2,
    marginBottom: 5,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  col50: { width: "50%" },

  // Tabla
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 6,
  },

  // Footer
  footer: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signLine: {
    borderTopWidth: 1,
    borderColor: "#000",
    width: "30%",
    textAlign: "center",
    paddingTop: 5,
    fontSize: 8,
  },
});

interface Props {
  data: RemitoSchema;
  products: { id: string; name: string }[];
  createdAt: string;
}

export const RemitoDocument = ({ data, products, createdAt }: Props) => {
  const dateObj = new Date(createdAt);
  const dateStr = dateObj.toLocaleDateString("es-AR");
  const timeStr = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // HARDCODED: Datos de la empresa de tu amigo
  const EMPRESA_ORIGEN = {
    nombre: "EMPRESA MIGUEL KREMPSER S.A.", // Reemplazar con nombre real
    direccion: "Ruta Nac. 34 Km X - Bandera, Sgo. del Estero",
    cuit: "30-XXXXXXXX-X",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER TIPO REMITO */}
        <View style={styles.headerBox}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{EMPRESA_ORIGEN.nombre}</Text>
            <Text style={{ fontSize: 9 }}>{EMPRESA_ORIGEN.direccion}</Text>
            <Text style={{ fontSize: 9 }}>CUIT: {EMPRESA_ORIGEN.cuit}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>ORDEN DE SALIDA / REMITO</Text>
            <Text style={styles.label}>NÚMERO DE ORDEN:</Text>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>
              {data.orderNumber}
            </Text>
            <Text style={styles.label}>FECHA DE EMISIÓN:</Text>
            <Text style={styles.value}>
              {dateStr} - {timeStr} hs
            </Text>
          </View>
        </View>

        {/* ORIGEN Y DESTINO (CRÍTICO POLICÍA) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>LOGÍSTICA DE TRASLADO</Text>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>ORIGEN (REMITENTE):</Text>
              <Text style={styles.value}>
                DEPÓSITO CENTRAL - {EMPRESA_ORIGEN.nombre}
              </Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>DESTINO (LUGAR DE APLICACIÓN):</Text>
              <Text style={styles.value}>{data.destination.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* TRANSPORTE Y RESPONSABLE */}
        <View style={styles.sectionBox}>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>INGENIERO / AUTORIZA:</Text>
              <Text style={styles.value}>{data.technician}</Text>
            </View>
            <View style={styles.col50}>
              <Text style={styles.label}>CHOFER / TRANSPORTISTA:</Text>
              <Text style={styles.value}>{data.driver}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col50}>
              <Text style={styles.label}>VEHÍCULO / PATENTE:</Text>
              <Text style={styles.value}>
                {data.plate?.toUpperCase() || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* DETALLE DE CARGA */}
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: "#000" }}>
          <View style={styles.tableHeader}>
            <Text style={{ width: "50%" }}>PRODUCTO / INSUMO</Text>
            <Text style={{ width: "25%" }}>LOTE</Text>
            <Text style={{ width: "25%", textAlign: "right" }}>CANTIDAD</Text>
          </View>
          {data.items.map((item, idx) => {
            const prodName =
              products.find((p) => p.id === item.productId)?.name ||
              "Desconocido";
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={{ width: "50%" }}>{prodName}</Text>
                <Text style={{ width: "25%" }}>{item.batch || "-"}</Text>
                <Text
                  style={{
                    width: "25%",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {item.quantity} {item.unit}
                </Text>
              </View>
            );
          })}
        </View>

        {/* OBSERVACIONES */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>OBSERVACIONES:</Text>
          <Text
            style={{
              borderBottomWidth: 1,
              borderColor: "#ccc",
              paddingBottom: 2,
            }}
          >
            {data.observations || "Sin observaciones."}
          </Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.footer}>
          <Text style={styles.signLine}>Firma Responsable Depósito</Text>
          <Text style={styles.signLine}>Firma Chofer / Recibe</Text>
          <Text style={styles.signLine}>Aclaración</Text>
        </View>

        <Text
          style={{
            position: "absolute",
            bottom: 20,
            left: 30,
            fontSize: 8,
            color: "#999",
          }}
        >
          Documento generado electrónicamente por Sistema AgroGestión el{" "}
          {dateStr}
        </Text>
      </Page>
    </Document>
  );
};
