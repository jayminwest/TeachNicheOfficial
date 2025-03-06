'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"

export function AboutAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="values">
        <AccordionTrigger>Values</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div>
              <h4 className="font-semibold mb-1">Community Collaboration</h4>
              <p>Teach Niche fosters a space where kendama players of all levels can connect, share, and grow together.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Growth and Learning</h4>
              <p>The platform is committed to continuous improvement, both in skills and as a community resource.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Integrity and Fairness</h4>
              <p>Teach Niche operates with transparency and ensures equitable opportunities for all community members.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Sustainability</h4>
              <p>The platform supports long-term growth for kendama enthusiasts and professionals alike.</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Other accordion items... */}
    </Accordion>
  )
}
