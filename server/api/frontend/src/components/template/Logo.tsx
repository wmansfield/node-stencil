import classNames from 'classnames'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

/**
 * Stencil mark — rounded square with indigo-violet gradient and a
 * stencil-S letterform (white stroke with three bridge cuts).
 */
const StencilMark = ({ size = 32 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <defs>
            <linearGradient
                id="stencil-mark-bg"
                x1="0" y1="0" x2="1" y2="1"
                gradientUnits="objectBoundingBox"
            >
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>

        {/* Background tile */}
        <rect width="32" height="32" rx="7" fill="url(#stencil-mark-bg)" />

        {/* S letterform as a thick white stroke */}
        <path
            d="M 22 10 C 22 7.5 10 7.5 10 12 C 10 15.5 22 16.5 22 20.5 C 22 25 10 25 10 22"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
        />

        {/* Three stencil bridges — drawn in gradient color to cut the S stroke */}
        <rect x="5"  y="10.5" width="22" height="2" fill="url(#stencil-mark-bg)" />
        <rect x="5"  y="15.5" width="22" height="2" fill="url(#stencil-mark-bg)" />
        <rect x="5"  y="20.5" width="22" height="2" fill="url(#stencil-mark-bg)" />
    </svg>
)

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        style,
        logoWidth = 'auto',
    } = props

    const textColor = mode === 'light' ? '#111827' : '#f9fafb'

    return (
        <div
            className={classNames('logo flex items-center gap-2', className)}
            style={{ ...style, width: logoWidth }}
        >
            <StencilMark size={32} />
            {type === 'full' && (
                <span
                    className="font-bold tracking-tight text-xl leading-none select-none"
                    style={{ color: textColor }}
                >
                    Stencil
                </span>
            )}
        </div>
    )
}

export default Logo
