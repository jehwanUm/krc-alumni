import DocNav from './DocNav';
import './girigocha.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="pg-giri">
      <div className="in doc-grid">
        <DocNav />
        {children}
      </div>
    </main>
  );
}
