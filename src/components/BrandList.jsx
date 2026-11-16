import { formatCount } from "../priceApi.js";

export default function BrandList({ items, selectedId, onPick }) {
  return (
    <div className="list-group brand-scroll" role="listbox" aria-label="Производители">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            className={"list-group-item list-group-item-action text-start" + (selected ? " active" : "")}
            role="option"
            aria-selected={selected}
            onClick={() => onPick(item)}
          >
            <span className="d-flex justify-content-between gap-3">
              <span className="fw-semibold">{item.brand}</span>
              <span className="small opacity-75">на складах {formatCount(item.count)}</span>
            </span>
            <span className="d-block small opacity-75">
              {item.name || "Без названия"}
              {item.number ? " · " + item.number : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
