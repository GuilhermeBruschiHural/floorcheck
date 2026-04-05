import { Factory } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-factory-500 rounded flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              Floor<span className="text-factory-400">Check</span>
            </span>
          </div>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} FloorCheck. Monitoramento inteligente de produtividade industrial.
          </p>
        </div>
      </div>
    </footer>
  )
}
