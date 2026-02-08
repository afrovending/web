import React from 'react';
import { Link } from 'react-router-dom';
import { X, GitCompare, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useCompare } from '../contexts/CompareContext';

const CompareTray = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  if (compareItems.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300"
      data-testid="compare-tray"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Items Preview */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <GitCompare className="h-4 w-4" />
              <span>Compare ({compareItems.length})</span>
            </div>
            
            <div className="flex items-center gap-2">
              {compareItems.map((item) => (
                <div 
                  key={item.id}
                  className="relative flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5 group"
                >
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=100'} 
                    alt={item.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <span className="text-sm font-medium max-w-[100px] truncate hidden sm:block">
                    {item.name}
                  </span>
                  <button
                    onClick={() => removeFromCompare(item.id)}
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`remove-compare-${item.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-muted-foreground"
              data-testid="clear-compare"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full"
              disabled={compareItems.length < 2}
              data-testid="compare-now-btn"
            >
              <Link to="/compare">
                Compare Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareTray;
