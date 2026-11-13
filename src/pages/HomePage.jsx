import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CharacterInfoSection from "../components/CharacterInfoSection.jsx";
import Header from "../components/Header.jsx";
import { getCharacterGroups } from "../services/characterGroupsService.js";

function HomePage() {
  const navigate = useNavigate();
  const [characterGroups, setCharacterGroups] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getCharacterGroups()
      .then((data) => {
        if (isMounted) {
          setCharacterGroups(data);
        }
      })
      .catch((error) => {
        console.error("Não foi possível carregar os dados do personagem.", error);
        if (isMounted) {
          setLoadError("Não foi possível carregar os dados do personagem.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleCharacterDetails(groupName) {
    navigate("/character", { state: { characterGroups, groupName } });
  }
  const basicInfoGroups = characterGroups?.filter((group) => group.basicInfo) ?? [];

  return (
    <>
      <Header />

      <main className="home-content">
        <section className="surface-card home-card">
          <p className="eyebrow">Página inicial</p>
          <h1 className="page-title">
            O que deseja fazer?
          </h1>
          <p className="description">
            Aqui estão todos os dados da sua campanha e personagem disponíveis para você
          </p>

          {!characterGroups && !loadError && (
            <p className="description">Carregando dados do personagem...</p>
          )}
          {loadError && <p className="description">{loadError}</p>}
          {basicInfoGroups.map((basicInfoGroup, index) => {
            const childGroups = characterGroups.filter(
              (group) => group.father === basicInfoGroup.groupName,
            );
            const basicInfoAttributes = (basicInfoGroup.attributes ?? [])
              .map((reference) => {
                const group = childGroups.find(
                  (item) => item.groupName === reference.groupName,
                );
                return group?.attributes?.find(
                  (attribute) => attribute.name === reference.attributeName,
                );
              })
              .filter(Boolean);

            return (
              <CharacterInfoSection
                key={`${basicInfoGroup.groupName}-${index}`}
                title={basicInfoGroup.groupName}
                columns={[basicInfoAttributes]}
              >
                {basicInfoGroup.hasDetails && (
                  <button
                    className="primary-button"
                    onClick={() => handleCharacterDetails(basicInfoGroup.groupName)}
                    type="button"
                  >
                    Mais detalhes
                  </button>
                )}
              </CharacterInfoSection>
            );
          })}
        </section>
      </main>
    </>
  );
}

export default HomePage;
