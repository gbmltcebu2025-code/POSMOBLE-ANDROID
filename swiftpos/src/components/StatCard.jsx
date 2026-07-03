import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
            <p className={`text-xl md:text-2xl font-bold mt-1 ${accent || ''}`}>{value}</p>
          </div>
          {Icon && <Icon className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground/30" />}
        </div>
      </CardContent>
    </Card>
  );
}