// src/components/Link.tsx
"use client";

import NextLink from 'next/link';
import { useLoading } from '@/context/LoadingContext';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
}

const Link: React.FC<LinkProps> = ({ href, children, ...props }) => {
    const { setIsLoading } = useLoading();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        setIsLoading(true);
        if (props.onClick) {
            props.onClick(e);
        }
    };

    return (
        <NextLink href={href} {...props} onClick={handleClick}>
            {children}
        </NextLink>
    );
};

export default Link;
