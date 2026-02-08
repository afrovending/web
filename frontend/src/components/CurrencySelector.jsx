import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { useCurrency } from '../contexts/CurrencyContext';

const CurrencySelector = ({ variant = 'default', showLabel = false }) => {
  const { currency, setCurrency, currencies, loading } = useCurrency();

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="opacity-50">
        <Globe className="h-4 w-4" />
      </Button>
    );
  }

  const currentCurrency = currencies[currency];

  // Group currencies by region
  const africanCurrencies = ['NGN', 'GHS', 'KES', 'ZAR', 'XOF', 'XAF'];
  const majorCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant === 'outline' ? 'outline' : 'ghost'} 
          size="sm"
          className="gap-1.5"
          data-testid="currency-selector"
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{currency}</span>
          {showLabel && (
            <span className="text-muted-foreground hidden sm:inline">
              ({currentCurrency?.symbol})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Major Currencies */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Major Currencies
        </DropdownMenuLabel>
        {majorCurrencies.map((code) => {
          const curr = currencies[code];
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setCurrency(code)}
              className={currency === code ? 'bg-primary/10' : ''}
              data-testid={`currency-${code}`}
            >
              <span className="w-8 font-medium">{code}</span>
              <span className="flex-1 text-muted-foreground">{curr.name}</span>
              <span className="text-muted-foreground">{curr.symbol}</span>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        {/* African Currencies */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          African Currencies
        </DropdownMenuLabel>
        {africanCurrencies.map((code) => {
          const curr = currencies[code];
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setCurrency(code)}
              className={currency === code ? 'bg-primary/10' : ''}
              data-testid={`currency-${code}`}
            >
              <span className="w-8 font-medium">{code}</span>
              <span className="flex-1 text-muted-foreground">{curr.name}</span>
              <span className="text-muted-foreground">{curr.symbol}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
