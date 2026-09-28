import React, { useState, useEffect } from "react";
import { UserCheck, Plus, ShieldCheck, ShieldAlert, KeyRound, AlertCircle } from "lucide-react";
import { listVolunteers, createVolunteer, updateVolunteer } from "../../../api/http";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

export function VolunteersTab({ accessToken, onFeedback }) {
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState({ volunteer_id: "", display_name: "", password: "" });
  const [state, setState] = useState({ loading: true, saving: false, error: "" });

  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setVolunteers(await listVolunteers(accessToken));
      setState({ loading: false, saving: false, error: "" });
    } catch (error) {
      setState({
        loading: false,
        saving: false,
        error: error.message || "Unable to load volunteers.",
      });
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken]);

  const create = async (event) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      await createVolunteer(accessToken, form);
      setForm({ volunteer_id: "", display_name: "", password: "" });
      onFeedback?.("Volunteer account created.");
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.message || "Unable to create volunteer.",
      }));
    }
  };

  const update = async (id, payload) => {
    try {
      await updateVolunteer(accessToken, id, payload);
      onFeedback?.("Volunteer account updated.");
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message || "Unable to update volunteer.",
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#071313]">Volunteer & Check-In Staff</h2>
          <p className="text-xs text-[#071313]/60">
            Provision dedicated credentials for race-day check-in desks and scanner volunteers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" className="font-bold uppercase text-[11px] px-3 py-1">
            {volunteers.filter((v) => v.active).length} Active Stations
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* CREATE ACCOUNT FORM */}
        <form
          onSubmit={create}
          className="rounded-2xl border border-white/10 bg-[#071313] p-6 text-white shadow-md space-y-4"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#d9ff38]" />
            <span className="text-[11px] font-black tracking-widest text-[#d9ff38] uppercase font-mono">
              NEW VOLUNTEER DESK
            </span>
          </div>
          <h3 className="text-lg font-black">Create Station Credentials</h3>
          <p className="text-xs leading-5 text-white/60">
            Volunteer accounts isolate access to the check-in scanner. Passwords are encrypted on the server.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                Volunteer ID
              </label>
              <input
                required
                minLength="3"
                maxLength="80"
                pattern="[-A-Za-z0-9._]+"
                value={form.volunteer_id}
                onChange={(e) => setForm({ ...form, volunteer_id: e.target.value })}
                placeholder="e.g. gate-01 or desk-road"
                className="mt-1 h-10 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-white/30 focus:border-[#d9ff38] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                Station / Staff Name
              </label>
              <input
                required
                minLength="2"
                maxLength="120"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="e.g. Gate 1 Road Challenge Desk"
                className="mt-1 h-10 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-white/30 focus:border-[#d9ff38] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                Temporary Password
              </label>
              <input
                required
                type="password"
                minLength="8"
                maxLength="128"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
                className="mt-1 h-10 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-white/30 focus:border-[#d9ff38] focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="accent"
            disabled={state.saving}
            className="w-full mt-4 font-bold"
          >
            {state.saving ? "Creating…" : "Create Volunteer Station"}
          </Button>
        </form>

        {/* VOLUNTEER LIST TABLE */}
        <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#071313]/5 pb-4">
            <h3 className="text-base font-black text-[#071313]">Configured Volunteer Desks</h3>
            <span className="text-xs text-black/45 font-mono">{volunteers.length} Total</span>
          </div>

          {state.error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {state.loading ? (
            <div className="py-12 flex justify-center">
              <LoadingIndicator label="Loading volunteers…" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-black/10">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/10 bg-[#fbf8ef] text-[#071313] font-mono">
                  <tr>
                    <th className="p-3.5 uppercase font-bold">Station / Volunteer</th>
                    <th className="p-3.5 uppercase font-bold">Volunteer ID</th>
                    <th className="p-3.5 uppercase font-bold">Status</th>
                    <th className="p-3.5 uppercase font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-black/[0.01]">
                      <td className="p-3.5">
                        <span className="font-bold text-[#071313] block">
                          {vol.display_name}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-black/60">
                        {vol.volunteer_id}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={vol.active ? "accent" : "secondary"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {vol.active ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update(vol.id, { active: !vol.active })}
                          className={`h-7 px-2.5 text-xs font-bold ${
                            vol.active
                              ? "text-red-600 hover:bg-red-50 hover:border-red-300"
                              : "text-green-700 hover:bg-green-50 hover:border-green-300"
                          }`}
                        >
                          {vol.active ? "Revoke Access" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {volunteers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-xs text-black/50">
                        No volunteer accounts created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
