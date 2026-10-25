import { Save, Trash2 } from "lucide-react";
import { addCustomerNote, deleteCustomerNote, updateCustomerDetails, updateIntakeAnswers } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { AdminCustomerRow } from "@/lib/admin/data";
import type { NoteRow } from "@/lib/admin/insights";
import { formatDateTime } from "@/lib/format";
import { intakeLabels } from "@/i18n/options";
import { allergyOptions, budgetOptions, cookingTimeOptions, dietOptions, experienceOptions, locationOptions, type Intake } from "@/lib/intake";

/** Formulieren op de klantpagina in het beheer (gegevens, vragenlijst en notities). */

const small = "btn-primary !px-4 !py-2 text-sm";

export function CustomerDetailsForm({ customer, back }: { customer: AdminCustomerRow; back: string }) {
  return (
    <form action={updateCustomerDetails} className="space-y-3 p-5 text-sm">
      <input type="hidden" name="klant" value={customer.id} />
      <input type="hidden" name="terug" value={back} />
      <label className="block">
        <span className="label">Naam</span>
        <input name="naam" defaultValue={customer.name} required minLength={2} maxLength={80} className="input !py-2.5" />
      </label>
      <label className="block">
        <span className="label">E-mailadres</span>
        <input name="email" type="email" defaultValue={customer.email} required className="input !py-2.5" />
      </label>
      <label className="block">
        <span className="label">Taal van mails en schema&apos;s</span>
        <select name="taal" defaultValue={customer.locale} className="input !py-2.5">
          <option value="nl">Nederlands</option>
          <option value="en">Engels</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="marketing" value="1" defaultChecked={customer.marketing} /> Nieuwsbrief en aanbiedingen per e-mail
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="herinneringen" value="1" defaultChecked={customer.weeklyReminders} /> Herinneringen voor het weegmoment
      </label>
      <p className="text-xs text-muted">
        Een nieuw e-mailadres geldt hier direct, ook op nieuwe facturen. Eerdere facturen houden het oude adres.
      </p>
      <SubmitButton className={small}>
        <Save className="size-4" aria-hidden /> Opslaan
      </SubmitButton>
    </form>
  );
}

function Select({ name, value, options, label }: { name: string; value: string; options: Record<string, string>; label: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select name={name} defaultValue={value} className="input !py-2.5">
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

export function IntakeEditForm({ customerId, intake, back }: { customerId: string; intake: Intake; back: string }) {
  const o = intakeLabels("nl");
  const opt = <T extends Record<string, { label: string } | string>>(x: T) =>
    Object.fromEntries(Object.entries(x).map(([k, v]) => [k, typeof v === "string" ? v : v.label])) as Record<string, string>;
  return (
    <form action={updateIntakeAnswers} className="grid gap-3 p-5 text-sm sm:grid-cols-2">
      <input type="hidden" name="klant" value={customerId} />
      <input type="hidden" name="terug" value={back} />
      <label className="block">
        <span className="label">Streefgewicht (kg)</span>
        <input name="targetWeightKg" inputMode="decimal" defaultValue={intake.targetWeightKg ?? ""} className="input !py-2.5" />
      </label>
      <Select name="diet" label="Eetpatroon" value={intake.diet} options={{ ...dietOptions }} />
      <fieldset className="sm:col-span-2">
        <legend className="label">Allergieën en intoleranties</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(Object.keys(allergyOptions) as (keyof typeof allergyOptions)[]).map((a) => (
            <label key={a} className="flex items-center gap-1.5">
              <input type="checkbox" name="allergies" value={a} defaultChecked={intake.allergies.includes(a)} /> {o.allergy[a]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="label">Andere allergieën</span>
        <input name="otherAllergies" defaultValue={intake.otherAllergies ?? ""} maxLength={200} className="input !py-2.5" />
      </label>
      <label className="block">
        <span className="label">Lust niet</span>
        <input name="dislikes" defaultValue={intake.dislikes ?? ""} maxLength={300} className="input !py-2.5" />
      </label>
      <Select name="mealsPerDay" label="Eetmomenten per dag" value={String(intake.mealsPerDay)} options={{ "3": "3", "4": "4", "5": "5" }} />
      <Select name="cookingTime" label="Kooktijd" value={intake.cookingTime} options={opt(cookingTimeOptions)} />
      <Select name="budget" label="Budget" value={intake.budget} options={{ ...budgetOptions }} />
      <Select name="location" label="Trainingsplek" value={intake.location} options={opt(locationOptions)} />
      <Select name="experience" label="Ervaring" value={intake.experience} options={opt(experienceOptions)} />
      <Select
        name="trainingDays"
        label="Trainingsdagen per week"
        value={String(intake.trainingDays)}
        options={Object.fromEntries([2, 3, 4, 5, 6].map((n) => [String(n), String(n)]))}
      />
      <label className="block">
        <span className="label">Minuten per training</span>
        <input name="sessionMinutes" type="number" min={20} max={90} step={5} defaultValue={intake.sessionMinutes} className="input !py-2.5" />
      </label>
      <label className="block">
        <span className="label">Blessures of klachten</span>
        <input name="injuries" defaultValue={intake.injuries ?? ""} maxLength={300} className="input !py-2.5" />
      </label>
      <label className="block">
        <span className="label">Medicijnen</span>
        <input name="medication" defaultValue={intake.medication ?? ""} maxLength={300} className="input !py-2.5" />
      </label>
      <label className="block">
        <span className="label">Opmerking voor het schema</span>
        <input name="notes" defaultValue={intake.notes ?? ""} maxLength={500} className="input !py-2.5" />
      </label>
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs text-muted">
          Gewicht, doel en gezondheidsvragen pas je niet hier aan: die komen uit de vragenlijst en de check-ins van de klant. Het volgende schema
          gebruikt de nieuwe antwoorden; wil je dat het huidige schema ze ook gebruikt, maak het dan opnieuw.
        </p>
        <SubmitButton className={small}>
          <Save className="size-4" aria-hidden /> Antwoorden opslaan
        </SubmitButton>
      </div>
    </form>
  );
}

export function NotesPanelBody({ customerId, notes, back }: { customerId: string; notes: NoteRow[]; back: string }) {
  return (
    <>
      {notes.length > 0 && (
        <ul className="divide-y divide-line">
          {notes.map((n) => (
            <li key={n.id} className="flex gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line">{n.text}</p>
                <p className="mt-0.5 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
              </div>
              <form action={deleteCustomerNote}>
                <input type="hidden" name="notitie" value={n.id} />
                <input type="hidden" name="klant" value={customerId} />
                <input type="hidden" name="terug" value={back} />
                <SubmitButton className="text-muted hover:text-accent-600">
                  <Trash2 className="size-4" aria-label="Notitie verwijderen" />
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={addCustomerNote} className={`space-y-2 p-5 ${notes.length ? "border-t border-line" : ""}`}>
        <input type="hidden" name="klant" value={customerId} />
        <input type="hidden" name="terug" value={back} />
        <label className="block">
          <span className="sr-only">Nieuwe notitie</span>
          <textarea name="tekst" rows={3} maxLength={2000} className="input text-sm" placeholder="Bijv. belde over het ontbijt; liever hartig" />
        </label>
        <SubmitButton className={small}>Notitie toevoegen</SubmitButton>
        <p className="text-xs text-muted">Alleen zichtbaar in het beheer, niet voor de klant.</p>
      </form>
    </>
  );
}
