import { forwardRef, type ButtonHTMLAttributes } from 'react'

// 구현 전달 2장의 버튼 상태: 주 버튼(ink) / 보조 버튼(sky) / 글자 버튼 / 위험(취소)
type Variant = 'primary' | 'secondary' | 'text' | 'danger' | 'inverse'

const styles: Record<Variant, string> = {
  primary:
    'bg-ink text-white hover:bg-ink-hover active:bg-ink-press active:translate-y-px disabled:bg-disabled disabled:text-disabled-ink',
  secondary:
    'bg-sky text-ink hover:bg-sky-hover active:bg-sky-press disabled:bg-[#f0f2f5] disabled:text-disabled-ink',
  text: 'px-0! font-semibold text-ink hover:underline underline-offset-4 active:text-muted disabled:text-[#b5bac4]',
  danger: 'bg-error text-white hover:brightness-110 active:brightness-95 disabled:bg-disabled disabled:text-disabled-ink',
  // ink 바탕 위(마지막 신청 섹션)에서 쓰는 주 버튼
  inverse: 'bg-white text-ink hover:bg-sky active:bg-sky-hover active:translate-y-px',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-btn px-[26px] py-[13px] text-[16px] font-bold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    />
  )
})
