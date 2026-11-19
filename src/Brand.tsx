import mark from "./assets/resumora-mark.svg?inline";
export function Brand() {
  return (
    <a className="brand" href="#/" aria-label="Resumora home">
      <img className="brand-symbol" src={mark} alt="" width="40" height="40" />
      <span className="wordmark">Resumora</span>
    </a>
  );
}
