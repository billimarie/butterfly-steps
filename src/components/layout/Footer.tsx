export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted/50 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {currentYear} Mojave Monarch Challenge by ForEveryStarATree.org. All rights reserved.</p>
        <p className="mt-1">
          Support Monarch Butterfly Conservation. 
          <a href="https://foreveryStaratree.org/donate.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
            Donate Now
          </a>
        </p>
      </div>
    </footer>
  );
}
