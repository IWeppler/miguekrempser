"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { RemitoSchema } from "@/features/moves/schemas/remito-schema";

// Estilos ajustados al formato oficial argentino (Imagen de referencia)
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#000",
  },

  // --- HEADER PRINCIPAL (Empresa - R - Datos Remito) ---
  headerContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    height: 100,
    marginBottom: 5,
  },
  headerLeft: {
    width: "45%",
    padding: 10,
    borderRightWidth: 1,
    justifyContent: "center",
  },
  headerCenter: {
    width: "10%",
    borderRightWidth: 1,
    alignItems: "center",
  },
  headerRight: {
    width: "45%",
    padding: 10,
  },

  // La letra "R" grande
  letterBox: {
    height: 40,
    width: "100%",
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize: 28,
    fontWeight: "bold",
  },
  letterCode: {
    fontSize: 6,
    marginTop: 2,
  },

  // Textos Empresa
  companyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  companyInfo: {
    fontSize: 7,
    marginBottom: 2,
    color: "#444",
  },

  // Datos del Remito (Derecha)
  remitoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 10,
  },
  dateBox: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  labelBold: { fontSize: 8, fontWeight: "bold" },

  // --- SECCIONES CLIENTE / TRANSPORTE ---
  sectionBox: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 5,
    padding: 5,
  },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { fontSize: 7, width: 60, color: "#666" },
  value: { fontSize: 8, fontWeight: "bold", flex: 1 },

  // --- TABLA DE ITEMS ---
  tableContainer: {
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 5,
    minHeight: 250, // Altura mínima para simular hoja completa
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#e0e0e0",
    padding: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  // Columnas (Anchos ajustados a la imagen)
  colQty: { width: "10%", textAlign: "right", paddingRight: 5 },
  colUnit: { width: "10%", textAlign: "center" },
  colCode: { width: "15%", textAlign: "center" },
  colDesc: { width: "40%" },
  colBatch: { width: "15%", textAlign: "center" },
  colBultos: { width: "10%", textAlign: "right" },

  headerText: { fontSize: 7, fontWeight: "bold" },
  rowText: { fontSize: 8 },

  // --- FOOTER LEGAL Y FIRMAS ---
  legalBox: {
    marginTop: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: "#000",
    minHeight: 40,
  },
  legalText: { fontSize: 6, color: "#555", fontStyle: "italic" },

  footerContainer: {
    flexDirection: "row",
    marginTop: 5,
    height: 60,
    borderWidth: 1,
    borderColor: "#000",
  },
  obsBox: {
    width: "60%",
    padding: 5,
    borderRightWidth: 1,
  },
  signBox: {
    width: "40%",
    padding: 5,
    justifyContent: "flex-end",
  },
  signLine: {
    borderTopWidth: 1,
    borderColor: "#000",
    marginTop: 20,
    textAlign: "center",
    fontSize: 7,
  },
  caiBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  caiText: { fontSize: 7, fontWeight: "bold" },
});

interface Props {
  data: RemitoSchema;
  products: { id: string; name: string; unit?: string }[]; // Agregué unit opcional
  createdAt: string;
}

export const RemitoDocument = ({ data, products, createdAt }: Props) => {
  const dateObj = new Date(createdAt);

  // EMPRESA FICTICIA (Reemplazar con datos reales de AgroGestión)
  const COMPANY = {
    name: "AGRO GESTIÓN S.A.",
    address: "Ruta Nacional 34 Km 500, Santa Fe",
    phone: "Tel: (0341) 455-5555",
    cuit: "30-71000000-1",
    iib: "915-758504-2",
    inicioAct: "12/06/2020",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          {/* Izquierda: Datos Empresa */}
          <View style={styles.headerLeft}>
            {/* Simulación de Logo (Caja) */}
            <View
              style={{
                borderWidth: 1,
                width: 30,
                height: 30,
                marginBottom: 5,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>AG</Text>
            </View>
            <Text style={styles.companyTitle}>{COMPANY.name}</Text>
            <Text style={styles.companyInfo}>{COMPANY.address}</Text>
            <Text style={styles.companyInfo}>{COMPANY.phone}</Text>
            <Text
              style={[styles.companyInfo, { fontWeight: "bold", marginTop: 2 }]}
            >
              I.V.A. RESPONSABLE INSCRIPTO
            </Text>
          </View>

          {/* Centro: Letra R */}
          <View style={styles.headerCenter}>
            <View style={styles.letterBox}>
              <Text style={styles.letter}>R</Text>
            </View>
            <Text style={styles.letterCode}>CÓD. Nº 091</Text>
          </View>

          {/* Derecha: Datos Documento */}
          <View style={styles.headerRight}>
            <Text style={styles.remitoTitle}>REMITO</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <Text style={styles.labelBold}>Nº COMPROBANTE:</Text>
              <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                00001-{data.orderNumber.padStart(8, "0")}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.labelBold}>FECHA EMISIÓN:</Text>
              <Text style={{ fontSize: 10 }}>
                {dateObj.toLocaleDateString("es-AR")}
              </Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.companyInfo}>CUIT: {COMPANY.cuit}</Text>
              <Text style={styles.companyInfo}>Ing. Brutos: {COMPANY.iib}</Text>
              <Text style={styles.companyInfo}>
                Inicio Act.: {COMPANY.inicioAct}
              </Text>
            </View>
          </View>
        </View>

        {/* --- DESTINATARIO (SEÑORES) --- */}
        <View style={styles.sectionBox}>
          <Text style={[styles.label, { width: "100%", marginBottom: 2 }]}>
            SEÑORES:
          </Text>
          <View style={styles.row}>
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>
              {data.destination.toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DOMICILIO:</Text>
            <Text style={styles.value}>LOTE / CAMPO ASIGNADO</Text>
            <Text style={styles.label}>LOC:</Text>
            <Text style={styles.value}>SANTIAGO DEL ESTERO</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>I.V.A.:</Text>
            <Text style={styles.value}>CONSUMIDOR FINAL</Text>
            <Text style={styles.label}>C.U.I.T.:</Text>
            <Text style={styles.value}>-</Text>
          </View>
        </View>

        {/* --- TRANSPORTE --- */}
        <View style={styles.sectionBox}>
          <View style={styles.row}>
            <Text style={styles.label}>COND. VENTA:</Text>
            <Text style={styles.value}>CUENTA CORRIENTE</Text>
            <Text style={styles.label}>TRANSPORTE:</Text>
            <Text style={styles.value}>{data.driver.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DOMICILIO:</Text>
            <Text style={styles.value}>-</Text>
            <Text style={styles.label}>PATENTE:</Text>
            <Text style={styles.value}>{data.plate?.toUpperCase() || "-"}</Text>
          </View>
        </View>

        {/* --- TABLA DE ITEMS --- */}
        <View style={styles.tableContainer}>
          {/* Header Tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colQty, styles.headerText]}>CANTIDAD</Text>
            <Text style={[styles.colUnit, styles.headerText]}>UM</Text>
            <Text style={[styles.colCode, styles.headerText]}>CÓDIGO</Text>
            <Text style={[styles.colDesc, styles.headerText]}>DESCRIPCIÓN</Text>
            <Text style={[styles.colBatch, styles.headerText]}>SERIE/LOTE</Text>
            <Text style={[styles.colBultos, styles.headerText]}>BULTOS</Text>
          </View>

          {/* Filas */}
          {data.items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            const prodName = product?.name || "Desconocido";
            const unit = item.unit || product?.unit || "ud"; // Usamos la unidad del form o del producto

            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.colQty, styles.rowText]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.colUnit, styles.rowText]}>{unit}</Text>
                <Text style={[styles.colCode, styles.rowText]}>
                  {index + 100}
                </Text>{" "}
                {/* Código dummy */}
                <Text style={[styles.colDesc, styles.rowText]}>{prodName}</Text>
                <Text style={[styles.colBatch, styles.rowText]}>
                  {item.batch || "-"}
                </Text>
                <Text style={[styles.colBultos, styles.rowText]}>1</Text>
              </View>
            );
          })}
        </View>

        {/* --- LEGAL DISCLAIMER (Copiado de la imagen) --- */}
        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            Comp. afectado:{" "}
            {data.observations ? `OBS: ${data.observations}` : "-"}
          </Text>
          <Text style={[styles.legalText, { marginTop: 2 }]}>
            SIENDO MI RESPONSABILIDAD, HE PROCEDIDO AL CONTROL DE LA MERCADERIA
            CARGADA EN EL TRANSPORTE, LA CUAL COINCIDE EN SU TOTALIDAD CON EL
            DETALLE DEL PRESENTE REMITO. FIRMO EN CONFORMIDAD.
          </Text>
          <Text style={[styles.legalText, { marginTop: 2 }]}>
            Las mercaderías involucradas en este remito viajan por cuenta y
            orden del destinatario. La empresa no se responsabiliza por daños o
            faltantes una vez firmada la conformidad.
          </Text>
        </View>

        {/* --- FIRMAS --- */}
        <View style={styles.footerContainer}>
          <View style={styles.obsBox}>
            <Text style={styles.labelBold}>OBSERVACIONES:</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              {data.observations}
            </Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.labelBold}>RECIBÍ CONFORME</Text>
            <View style={styles.signLine}>
              <Text>FIRMA Y ACLARACIÓN</Text>
            </View>
          </View>
        </View>

        {/* --- CAI / VENCIMIENTO --- */}
        <View style={styles.caiBox}>
          <Text style={{ fontSize: 6 }}>
            Original: Blanco / Duplicado: Color
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.caiText}>C.A.I. Nº: 51465215829726</Text>
            <Text style={styles.caiText}>Fecha Vto.: 17/11/2028</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
