const ExcelJS = require("exceljs");
const prisma = require("../config/prisma.client");
const path = require("path");
const fs = require("fs/promises");

async function exportarDespesasParaExcel(viagemId) {
  const despesas = await prisma.despesa.findMany({
    where: { viagemId },
    orderBy: { dataHora: "asc" }
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Despesas");

  worksheet.columns = [
    { header: "Data", key: "data", width: 15 },
    { header: "Hora", key: "hora", width: 10 },
    { header: "Fornecedor", key: "fornecedor", width: 30 },
    { header: "CNPJ", key: "cnpj", width: 20 },
    { header: "Valor (R$)", key: "valor", width: 15 }
  ];

  despesas.forEach((d) => {
    const dataHora = new Date(d.dataHora);
    const data = dataHora.toLocaleDateString("pt-BR");
    const hora = dataHora.toLocaleTimeString("pt-BR");

    const matchFornecedor = d.fornecedor.match(/^(.*?)\s+\((.*?)\)$/);
    const nomeFornecedor = matchFornecedor ? matchFornecedor[1] : d.fornecedor;
    const matchcnpj = d.cnpj.match(/^(.*?)\s+\((.*?)\)$/);
    const cnpjFornecedor = matchcnpj ? matchcnpj[2] : d.cnpj;

    worksheet.addRow({
      data,
      hora,
      fornecedor: nomeFornecedor,
      cnpj: cnpjFornecedor,
      valor: d.valor
    });
  });

  const caminho = path.join(__dirname, "..", "public", `despesas_viagem_${viagemId}.xlsx`);
  await workbook.xlsx.writeFile(caminho);

  return caminho;
}

module.exports = {
  exportarDespesasParaExcel
};
