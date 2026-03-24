interface Activity {
  id: string;
  subjectName: string;
  subjectEmoji: string;
  type: 'seteok' | 'report';
  topic: string;
  charCount: number;
  createdAt: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center text-sm text-purple-300">
        아직 생성한 세특이 없어요.<br />
        <span className="text-purple-400 font-medium">첫 세특을 만들어보세요!</span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="mb-3 font-bold text-purple-900">최근 활동</h2>
      <div className="space-y-2">
        {activities.map(a => {
          const date = new Date(a.createdAt);
          const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

          return (
            <div
              key={a.id}
              className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-purple-50"
            >
              <span className="text-xl flex-shrink-0">{a.subjectEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-purple-900">{a.topic}</p>
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <span>{a.subjectName}</span>
                  <span>·</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                    a.type === 'seteok' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {a.type === 'seteok' ? '세특' : '탐구'}
                  </span>
                  <span>·</span>
                  <span>{a.charCount.toLocaleString()}자</span>
                </div>
              </div>
              <span className="flex-shrink-0 text-xs text-purple-300">{dateLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
