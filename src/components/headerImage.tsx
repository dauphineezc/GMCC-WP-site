// components/headerImage.tsx
type HeaderImageProps = {
    src: string;
    alt: string;
  };
  
  export default function HeaderImage({ src, alt }: HeaderImageProps) {
    return (
      <div className="relative w-full overflow-hidden bg-neutral-100 mb-8">
        <img
          src={src}
          alt={alt}
          className="h-72 w-full object-cover sm:h-96 lg:h-[24rem]"
        />
      </div>
    );
  }