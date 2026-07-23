import './Skeleton.css'

export default function Skeleton({
  width,
  height,
  radius,
  borderRadius,
  variant,
  circle = false,
  className = '',
  style: customStyle,
  ...props
}) {
  const isCircle = circle || variant === 'avatar'
  const resolvedRadius = radius || borderRadius

  const style = {
    ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(resolvedRadius ? { borderRadius: resolvedRadius } : {}),
    ...customStyle,
  }

  const variantClass = variant ? `gf-skeleton--${variant}` : ''
  const circleClass = isCircle ? 'gf-skeleton--circle' : ''

  return (
    <span
      className={`gf-skeleton ${variantClass} ${circleClass} ${className}`.trim()}
      style={style}
      aria-hidden="true"
      {...props}
    />
  )
}
