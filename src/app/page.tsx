import MainMenu from '@/components/MainMenu';
import { COLORS } from '@/render/theme';

export default function Home() {
    return (
        <main
            className="flex flex-1 items-center justify-center bg-[#05070d]"
            // Faint arena grid behind the menu (pure CSS, no canvas needed)
            style={{
                backgroundImage:
                    `linear-gradient(${COLORS.gridLine} 1px, transparent 1px),` +
                    `linear-gradient(90deg, ${COLORS.gridLine} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}
        >
            <MainMenu />
        </main>
    );
}
