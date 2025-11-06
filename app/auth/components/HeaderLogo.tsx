import Image from 'next/image';
import Link from 'next/link';

export default function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 mb-6">
      <Image
        src="/images/logo.svg"
        alt="African Market Hub Logo"
        width={200}
        height={200}
      />
     </Link>
  );
}
