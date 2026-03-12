const TASK_GROUPS = [
  {
    id: "task-1",
    label: "Tarefa 1",
    fill: "#58C093",
    stroke: "#2E9D71",
    fold: "#2B936A",
    text: "#F4FFF8",
    centerY: 405,
    subtaskTopY: 295
  },
  {
    id: "task-2",
    label: "Tarefa 2",
    fill: "#EDB739",
    stroke: "#C98D16",
    fold: "#BE7E0D",
    text: "#3E2400",
    centerY: 705,
    subtaskTopY: 595
  },
  {
    id: "task-3",
    label: "Tarefa 3",
    fill: "#EE8E36",
    stroke: "#CC6522",
    fold: "#BA4F17",
    text: "#FFF5EA",
    centerY: 1005,
    subtaskTopY: 895
  },
  {
    id: "task-4",
    label: "Tarefa 4",
    fill: "#D85A68",
    stroke: "#B53B49",
    fold: "#972632",
    text: "#FFF1F4",
    centerY: 1305,
    subtaskTopY: 1195
  }
] as const;

const SUBTASK_LABELS = ["Subtask 1", "Subtask 2", "Subtask 3", "Subtask 4"] as const;

export type SelectedProjectNode =
  | {
      kind: "project";
      projectId: string;
    }
  | {
      kind: "task";
      projectId: string;
      taskId: string;
    }
  | {
      kind: "subtask";
      projectId: string;
      taskId: string;
      subtaskId: string;
    };

const PROJECT_NODE = {
  x: 36,
  y: 74,
  width: 382,
  height: 136
} as const;

const TASK_NODE = {
  x: 448,
  width: 286,
  height: 94
} as const;

const SUBTREE = {
  trunkX: 768,
  squareX: 792,
  textX: 844,
  rightLineX: 1014,
  rowHeight: 54
} as const;

export function ProjectsTree() {
  const projectBottomX = PROJECT_NODE.x + PROJECT_NODE.width / 2;
  const projectBottomY = PROJECT_NODE.y + PROJECT_NODE.height;

  return (
    <section className="rounded-[2rem] border border-black/6 bg-[linear-gradient(180deg,#f7f2ea_0%,#efe9df_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <div className="overflow-auto rounded-[1.5rem] border border-black/5 bg-[#f5f0e7] px-3 py-3">
        <div className="mx-auto min-w-[940px] max-w-[1080px]">
          <svg viewBox="0 0 1080 1460" className="h-auto w-full" role="img" aria-label="Arvore visual de projeto, tarefas e subtarefas">
            <defs>
              <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#5b5348" floodOpacity="0.12" />
              </filter>
              <filter id="lightText" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#42382d" floodOpacity="0.22" />
              </filter>
            </defs>

            <g filter="url(#nodeShadow)">
              <rect
                x={PROJECT_NODE.x}
                y={PROJECT_NODE.y}
                width={PROJECT_NODE.width}
                height={PROJECT_NODE.height}
                rx="22"
                fill="url(#projectFill)"
                stroke="#2148AF"
                strokeWidth="2.5"
              />
            </g>

            <defs>
              <linearGradient id="projectFill" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#416DEB" />
                <stop offset="100%" stopColor="#365BD3" />
              </linearGradient>
            </defs>

            <text
              x={PROJECT_NODE.x + 48}
              y={PROJECT_NODE.y + 88}
              fill="#F8FBFF"
              fontSize="62"
              fontWeight="600"
              letterSpacing="-2"
              filter="url(#lightText)"
            >
              Projeto
            </text>

            <line
              x1={projectBottomX}
              y1={projectBottomY}
              x2={projectBottomX}
              y2={TASK_GROUPS[0].centerY}
              stroke="#47AE4E"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={projectBottomX}
              y1={TASK_GROUPS[0].centerY}
              x2={projectBottomX}
              y2={TASK_GROUPS[1].centerY}
              stroke="#47AE4E"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={projectBottomX}
              y1={TASK_GROUPS[1].centerY}
              x2={projectBottomX}
              y2={TASK_GROUPS[2].centerY}
              stroke="#CF8D21"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={projectBottomX}
              y1={TASK_GROUPS[2].centerY}
              x2={projectBottomX}
              y2={TASK_GROUPS[3].centerY}
              stroke="#C64D56"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {TASK_GROUPS.map((task) => (
              <g key={task.id}>
                <line
                  x1={projectBottomX}
                  y1={task.centerY}
                  x2={TASK_NODE.x}
                  y2={task.centerY}
                  stroke={task.stroke}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />

                <g filter="url(#nodeShadow)">
                  <rect
                    x={TASK_NODE.x}
                    y={task.centerY - TASK_NODE.height / 2}
                    width={TASK_NODE.width}
                    height={TASK_NODE.height}
                    rx="18"
                    fill={task.fill}
                    stroke={task.stroke}
                    strokeWidth="2.5"
                  />
                  <path
                    d={`M ${TASK_NODE.x + TASK_NODE.width - 22} ${task.centerY - TASK_NODE.height / 2} H ${TASK_NODE.x + TASK_NODE.width} V ${task.centerY - TASK_NODE.height / 2 + 22} Q ${TASK_NODE.x + TASK_NODE.width - 4} ${task.centerY - TASK_NODE.height / 2 + 10} ${TASK_NODE.x + TASK_NODE.width - 22} ${task.centerY - TASK_NODE.height / 2 + 10} Z`}
                    fill={task.fold}
                    opacity="0.95"
                  />
                </g>

                <text
                  x={TASK_NODE.x + 42}
                  y={task.centerY + 17}
                  fill={task.text}
                  fontSize="36"
                  fontWeight="600"
                  letterSpacing="-1"
                  filter="url(#lightText)"
                >
                  {task.label}
                </text>

                <line
                  x1={TASK_NODE.x + TASK_NODE.width}
                  y1={task.centerY}
                  x2={SUBTREE.trunkX}
                  y2={task.centerY}
                  stroke={task.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={SUBTREE.trunkX}
                  y1={task.subtaskTopY}
                  x2={SUBTREE.trunkX}
                  y2={task.subtaskTopY + SUBTREE.rowHeight * 3}
                  stroke={task.stroke}
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {SUBTASK_LABELS.map((label, index) => {
                  const rowY = task.subtaskTopY + SUBTREE.rowHeight * index;
                  return (
                    <g key={`${task.id}-${label}`}>
                      <path
                        d={`M ${SUBTREE.trunkX} ${rowY + 22} H ${SUBTREE.squareX - 10} Q ${SUBTREE.squareX - 2} ${rowY + 22} ${SUBTREE.squareX - 2} ${rowY + 14} V ${rowY + 6} Q ${SUBTREE.squareX - 2} ${rowY - 2} ${SUBTREE.squareX + 6} ${rowY - 2} H ${SUBTREE.squareX}`}
                        fill="none"
                        stroke={task.stroke}
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x={SUBTREE.squareX}
                        y={rowY - 14}
                        width="34"
                        height="34"
                        rx="6"
                        fill="#F5F0E7"
                        stroke={task.stroke}
                        strokeWidth="3"
                      />
                      <line
                        x1={SUBTREE.squareX + 34}
                        y1={rowY + 3}
                        x2={SUBTREE.rightLineX}
                        y2={rowY + 3}
                        stroke={task.stroke}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.86"
                      />
                      <text
                        x={SUBTREE.textX}
                        y={rowY + 10}
                        fill={index === 0 ? "#1C2430" : mixTaskText(task.stroke)}
                        fontSize="28"
                        fontWeight="500"
                        letterSpacing="-0.6"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

function mixTaskText(color: string) {
  if (color === "#2E9D71") {
    return "#2D3A33";
  }

  if (color === "#C98D16") {
    return "#A5700E";
  }

  if (color === "#CC6522") {
    return "#1C2430";
  }

  if (color === "#B53B49") {
    return "#1C2430";
  }

  return "#1C2430";
}
