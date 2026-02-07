import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

const VariantSelector = ({ 
  product, 
  onVariantSelect, 
  selectedOptions = {},
  className = '' 
}) => {
  const [options, setOptions] = useState(selectedOptions);

  // Get available options from variant_options
  const variantOptions = product.variant_options || [];

  // Find the matching variant based on selected options
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    if (Object.keys(options).length !== variantOptions.length) return null;

    return product.variants.find(variant => {
      if (!variant.options) return false;
      return Object.entries(options).every(
        ([key, value]) => variant.options[key] === value
      );
    });
  }, [options, product.variants, variantOptions.length]);

  // Notify parent of variant selection
  useEffect(() => {
    onVariantSelect(selectedVariant, options);
  }, [selectedVariant, options, onVariantSelect]);

  // Check if a specific option value is available (has stock)
  const isOptionAvailable = (optionName, optionValue) => {
    // Create a test selection with this option
    const testOptions = { ...options, [optionName]: optionValue };
    
    // Check if any variant matches this partial selection and has stock
    return product.variants?.some(variant => {
      if (!variant.options) return false;
      const matches = Object.entries(testOptions).every(
        ([key, value]) => variant.options[key] === value
      );
      return matches && (variant.stock > 0);
    });
  };

  // Get the current price based on selection
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentComparePrice = selectedVariant?.compare_price ?? product.compare_price;
  const currentStock = selectedVariant?.stock ?? product.stock;

  const handleOptionSelect = (optionName, value) => {
    setOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  if (!product.has_variants || variantOptions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {variantOptions.map((option) => (
        <div key={option.name}>
          <Label className="text-sm font-medium mb-2 block">
            {option.name}
            {options[option.name] && (
              <span className="text-muted-foreground ml-2">: {options[option.name]}</span>
            )}
          </Label>
          
          {/* Color variant - show as color swatches */}
          {option.name.toLowerCase() === 'color' ? (
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = options[option.name] === value;
                const isAvailable = isOptionAvailable(option.name, value);
                
                // Try to get color code, fallback to value as color name
                const colorMap = {
                  'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
                  'yellow': '#eab308', 'purple': '#a855f7', 'pink': '#ec4899',
                  'orange': '#f97316', 'black': '#000000', 'white': '#ffffff',
                  'gray': '#6b7280', 'brown': '#92400e', 'navy': '#1e3a8a',
                  'beige': '#d4b896', 'cream': '#fffdd0', 'gold': '#ffd700'
                };
                const colorCode = colorMap[value.toLowerCase()] || value;
                
                return (
                  <button
                    key={value}
                    onClick={() => isAvailable && handleOptionSelect(option.name, value)}
                    disabled={!isAvailable}
                    className={`
                      relative w-10 h-10 rounded-full border-2 transition-all
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                    `}
                    style={{ backgroundColor: colorCode, borderColor: colorCode === '#ffffff' ? '#e5e7eb' : 'transparent' }}
                    title={value}
                    data-testid={`variant-color-${value.toLowerCase()}`}
                  >
                    {isSelected && (
                      <Check className={`absolute inset-0 m-auto h-5 w-5 ${colorCode === '#ffffff' || colorCode === '#fffdd0' ? 'text-black' : 'text-white'}`} />
                    )}
                    {!isAvailable && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-red-500 rotate-45 absolute" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Size and other variants - show as buttons */
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = options[option.name] === value;
                const isAvailable = isOptionAvailable(option.name, value);
                
                return (
                  <Button
                    key={value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => isAvailable && handleOptionSelect(option.name, value)}
                    disabled={!isAvailable}
                    className={`
                      min-w-[3rem] rounded-lg
                      ${!isAvailable ? 'opacity-30 line-through' : ''}
                    `}
                    data-testid={`variant-${option.name.toLowerCase()}-${value.toLowerCase()}`}
                  >
                    {value}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Price and Stock Display */}
      {selectedVariant && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-baseline gap-3">
            <span className="font-accent text-3xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </span>
            {currentComparePrice && currentComparePrice > currentPrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${currentComparePrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="mt-2">
            {currentStock > 0 ? (
              currentStock <= 5 ? (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Only {currentStock} left
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  In Stock ({currentStock} available)
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                Out of Stock
              </Badge>
            )}
          </div>
          
          {selectedVariant.sku && (
            <p className="text-xs text-muted-foreground mt-2">
              SKU: {selectedVariant.sku}
            </p>
          )}
        </div>
      )}

      {/* Prompt to select if not all options selected */}
      {!selectedVariant && variantOptions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Please select {variantOptions.filter(o => !options[o.name]).map(o => o.name).join(' and ')}
        </p>
      )}
    </div>
  );
};

export default VariantSelector;
