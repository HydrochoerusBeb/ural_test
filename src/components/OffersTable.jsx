import { formatCount, formatPrice } from "../priceApi.js";

function sourceLabel(source) {
  return source === "analog" ? "Аналог" : "Деталь";
}

export default function OffersTable({ rows }) {
  return (
    <div className="table-responsive offers-scroll">
      <table className="table table-sm table-striped table-hover align-middle mb-0 offers-table">
        <caption className="visually-hidden">Аналоги и предложения складов</caption>
        <thead>
          <tr>
            <th scope="col">Тип</th>
            <th scope="col">Производитель</th>
            <th scope="col">Наименование</th>
            <th scope="col">Номер</th>
            <th scope="col">Склад</th>
            <th scope="col" className="text-end">Цена</th>
            <th scope="col" className="text-end">Остаток</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rowKey}>
              <td>{sourceLabel(row.source)}</td>
              <td>{row.brand}</td>
              <td className="name-cell">{row.name}</td>
              <td>{row.number}</td>
              <td>{row.warehouse || "—"}</td>
              <td className="text-end text-nowrap">{formatPrice(row.price)}</td>
              <td className="text-end">{formatCount(row.stock)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
