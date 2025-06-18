import clsx from "clsx";

interface ButtonProps {
  id?: string;
  title: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerClass?: string;
  href?: string;
}

const Button = ({
  id,
  title,
  rightIcon,
  leftIcon,
  href,
  containerClass = '',
}: ButtonProps) => {
  const Tag = href ? 'a' : 'button';

  return (
    <Tag
      id={id}
      {...(href
        ? {
            href,
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {})}
      className={clsx(
        "group relative z-10 rounded-full px-6 md:px-10 py-6 text-black mr-3 mb-3 mt-3 cursor-none",
        containerClass
      )}
    >
      {leftIcon}

      {/* Use a flex container for title and rightIcon */}
      <span className="relative inline-flex items-center overflow-hidden font-general sm:text-xs md:text-xl font-bold uppercase">
        <div className="translate-y-0 skew-y-0 transition duration-500 group-hover:translate-y-[-160%] group-hover:skew-y-12">
          {title}
        </div>
        <div className="absolute translate-y-[164%] skew-y-12 transition duration-500 group-hover:translate-y-0 group-hover:skew-y-0">
          {title}
        </div>
        {rightIcon && <span className="ml-2">{rightIcon}</span>} {/* Add margin to space icon */}
      </span>
    </Tag>
  );
};

export default Button;