import React from 'react'

const MDEditor = ({ value, onChange, readOnly, previewOptions }: any) => {
  return (
    <div data-testid="md-editor">
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  )
}

export default MDEditor
