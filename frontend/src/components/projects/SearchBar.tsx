import { useI18n } from "../../lib/i18n";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange
}: SearchBarProps) {
  const { tr } = useI18n();
  return (
    <input
      type="text"
      placeholder={tr("Buscar projetos...", "Search projects...")}
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="
        w-full
        rounded-lg
        border
        px-4
        py-2
        bg-white
      "
    />
  );
}
