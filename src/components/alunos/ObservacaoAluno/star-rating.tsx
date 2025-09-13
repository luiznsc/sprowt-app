import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, onRatingChange, readonly = false, size = 'md' }: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleStarClick(star)}
          disabled={readonly}
          className={`p-0 h-auto hover:bg-transparent ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-muted-foreground'
            } transition-colors`}
          />
        </Button>
      ))}
      {!readonly && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating}/5` : 'Clique para avaliar'}
        </span>
      )}
    </div>
  );
}
