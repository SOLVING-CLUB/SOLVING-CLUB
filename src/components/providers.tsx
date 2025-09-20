"use client";
import { ThemeProvider } from "next-themes";
import { SimpleToaster } from "@/components/ui/simple-toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			{children}
			<SimpleToaster />
		</ThemeProvider>
	);
}
