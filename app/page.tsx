import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Calculadora Laboral</h1>
        <p className="text-gray-600">
          Calcula tu finiquito real según la ley laboral chilena. Ingresa tus datos
          y obtén el monto total que te corresponde, incluyendo nulidad del despido.
        </p>
        <Link
          href="/finiquito"
          className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Calcular mi finiquito
        </Link>
      </div>
    </main>
  );
}
