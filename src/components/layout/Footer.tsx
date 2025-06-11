export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted/50 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {currentYear} Butterfly Steps by <a href="https://foreverystaratree.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">For Every Star, A Tree</a>. All rights reserved.</p>
        <p className="mt-1">
          You can support our quarter-acre butterfly garden in the Mojave Desert.
          <a href="https://foreveryStaratree.org/donate.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
            Donate Now
          </a>
        </p>
      </div>
    </footer>
  );
}
