import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  title: string;
  subtitle?: string;
  image?: string | null;
  featured?: boolean;
  active?: boolean;
  meta?: string;
  adminUrl?: string;
}

export function ContentCard({
  title,
  subtitle,
  image,
  featured,
  active = true,
  meta,
  adminUrl,
}: ContentCardProps) {
  const Wrapper = adminUrl ? "a" : "div";
  const wrapperProps = adminUrl
    ? { href: adminUrl, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      <Card className={cn("overflow-hidden", !active && "opacity-60", adminUrl && "cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-brand-700/30")}>
        <div className="aspect-[16/10] bg-gray-100 relative">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              No image
            </div>
          )}
          {featured && (
            <Badge className="absolute top-2 right-2 bg-brand-700 text-white text-xs">
              Featured
            </Badge>
          )}
          {adminUrl && (
            <div className="absolute top-2 left-2 bg-black/60 text-white rounded p-1">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
          {meta && (
            <p className="text-xs text-muted-foreground mt-1">{meta}</p>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
}
