import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

export default function ProductivityChart({ data, type = 'bar' }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Sem dados disponíveis</p>
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <div className="glass rounded-xl p-4">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Bar dataKey="ativo" fill="#10b981" radius={[4, 4, 0, 0]} name="Ativo (min)" />
          <Bar dataKey="ocioso" fill="#ef4444" radius={[4, 4, 0, 0]} name="Ocioso (min)" />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
