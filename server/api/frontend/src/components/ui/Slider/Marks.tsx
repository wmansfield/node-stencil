import getPosition from './utils/getPosition'
import classNames from '../utils/classNames'
import type { ReactNode } from 'react'

function isMarkFilled({
    mark,
    offset,
    value,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mark: { value: number; label?: any }
    offset?: number
    value: number
    inverted?: boolean
}) {
    return typeof offset === 'number'
        ? mark.value >= offset && mark.value <= value
        : mark.value <= value
}

export interface MarksProps {
    marks?: { value: number; label?: ReactNode }[]
    min: number
    max: number
    value: number
    offset?: number
    disabled?: boolean
    markClass?: string | ((isFilled: boolean) => string)
}

function Marks({
    marks,
    min,
    max,
    disabled,
    value,
    offset,
    markClass,
}: MarksProps) {
    if (!marks) {
        return null
    }

    const items = marks.map((mark, index) => (
        <div
            key={index}
            className="slider-mark-wrapper"
            style={{
                insetInlineStart: `calc(${getPosition({ value: mark.value, min, max })}% - 6px / 2)`,
            }}
        >
            <div
                className={classNames(
                    'slider-mark',
                    isMarkFilled({ mark, offset, value }) &&
                        'slider-mark-filled',
                    disabled && 'disabled',
                    typeof markClass === 'function'
                        ? markClass(isMarkFilled({ mark, offset, value }))
                        : markClass,
                )}
            />
            {mark.label && (
                <div className="slider-mark-label">{mark.label}</div>
            )}
        </div>
    ))

    return <div>{items}</div>
}

export default Marks
