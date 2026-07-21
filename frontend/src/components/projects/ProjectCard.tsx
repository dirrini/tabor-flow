import { Link } from "react-router-dom";

import StatusBadge from "./StatusBadge";

import type { ProjectStatus }
  from "../../types/Project";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: ProjectStatus;
}

export default function ProjectCard({
  id,
  name,
  description,
  progress,
  status
}: ProjectCardProps) {
  return (
    <Link
      to={`/app/projects/${id}`}
      className="
        block
        bg-white
        rounded-xl
        border
        shadow-sm
        p-5
        hover:shadow-md
        transition-shadow
      "
    >
      <div
        className="
          flex
          justify-between
          items-start
          mb-3
        "
      >
        <h3
          className="
            text-lg
            font-semibold
          "
        >
          {name}
        </h3>

        <StatusBadge status={status} />
      </div>

      <p
        className="
          text-slate-600
          text-sm
          mb-5
        "
      >
        {description}
      </p>

      <div>
        <div
          className="
            flex
            justify-between
            text-sm
            mb-2
          "
        >
          <span>Progress</span>
          <span>{progress}%</span>
        </div>

        <div
          className="
            w-full
            h-2
            bg-slate-200
            rounded-full
            overflow-hidden
          "
        >
          <div
            className={`
              h-full
              rounded-full
              transition-all
              ${
                status === "COMPLETED"
                  ? "bg-blue-600"
                  : status === "AT_RISK"
                  ? "bg-yellow-500"
                  : "bg-green-600"
              }
            `}
            style={{
              width: `${progress}%`
            }}
          />
        </div>
      </div>
    </Link>
  );
}
