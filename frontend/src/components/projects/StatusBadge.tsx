import type { ProjectStatus }
  from "../../types/Project";
import { useI18n } from "../../lib/i18n";

interface Props {
  status: ProjectStatus;
}

export default function StatusBadge({
  status
}: Props) {
  const { tr } = useI18n();
  const styles = {
    ON_TRACK:
      "bg-green-100 text-green-700",

    AT_RISK:
      "bg-yellow-100 text-yellow-700",

    COMPLETED:
      "bg-blue-100 text-blue-700"
  };

  const labels = {
    ON_TRACK: tr("No prazo", "On Track"),
    AT_RISK: tr("Em risco", "At Risk"),
    COMPLETED: tr("Concluído", "Completed")
  };

  return (
    <span
      className={`
        px-3
        py-1
        rounded-full
        text-xs
        font-medium
        ${styles[status]}
      `}
    >
      {labels[status]}
    </span>
  );
}
