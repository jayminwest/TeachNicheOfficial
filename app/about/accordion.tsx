'use client';

import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionProps {
  items: {
    title: string;
    content: React.ReactNode;
  }[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg">
          <button
            className="flex justify-between items-center p-4 cursor-pointer w-full text-left"
            onClick={() => toggleItem(index)}
            aria-expanded={openIndex === index}
            aria-controls={`accordion-content-${index}`}
          >
            <h3 className="text-lg font-medium">{item.title}</h3>
            <span aria-hidden="true">
              {openIndex === index ? 
                <ChevronUp className="h-5 w-5" /> : 
                <ChevronDown className="h-5 w-5" />
              }
            </span>
          </button>
          <div
            id={`accordion-content-${index}`}
            className={cn(
              "overflow-hidden transition-all duration-300",
              openIndex === index ? "p-4 border-t" : "max-h-0 border-t-0"
            )}
          >
            {openIndex === index && item.content}
          </div>
        </div>
      ))}
    </div>
  );
}
