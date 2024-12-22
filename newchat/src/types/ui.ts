import { ButtonHTMLAttributes, InputHTMLAttributes, TableHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface FormProps<T> {
  form: any;
  onSubmit?: (values: T) => void;
  children?: ReactNode;
  className?: string;
}

export interface FormFieldProps<T> {
  control: any;
  name: keyof T;
  render: (props: { field: any }) => ReactNode;
}

export interface FormItemProps {
  children?: ReactNode;
  className?: string;
}

export interface FormLabelProps {
  children?: ReactNode;
  className?: string;
}

export interface FormControlProps {
  children?: ReactNode;
  className?: string;
}

export interface FormMessageProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogContentProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogHeaderProps {
  children?: ReactNode;
  className?: string;
}

export interface DialogTitleProps {
  children?: ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  children?: ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children?: ReactNode;
  className?: string;
}

export interface TableRowProps {
  children?: ReactNode;
  className?: string;
}

export interface TableHeadProps {
  children?: ReactNode;
  className?: string;
}

export interface TableCellProps {
  children?: ReactNode;
  className?: string;
}
